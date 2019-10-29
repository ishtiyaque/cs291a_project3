# frozen_string_literal: true

require 'rufus-scheduler'
require 'sinatra'
require 'json'
require 'jwt'

set server: 'thin'
$uptime = 0
$scheduler = Rufus::Scheduler.new

NEW_LOGIN = 0
RE_LOGIN = 1
CONNECTED = 2

$userlist = {}
$secret = 'SECRET'
$onlineUsers = []
$messageHistory = ["\nevent: ServerStatus\ndata: {\"status\": \"Server Started\", \"created\": #{Time.now.to_f}}\n\n\n"]
#$messageHistory = []

class OnlineUser
  def initialize(username, connection, status)
    # Instance variables
    @username = username
    @connection = connection
    @status = status
  end

  def getUserName
    return @username
  end
  def getConnection
    return @connection
  end
  def getStatus
    return @status
  end
  def setUserName username
    @username = username
  end
  def setConnection connection
    @connection = connection
  end
  def setStatus status
    @status = status
  end
end

def validate_token(token)
  decoded = (JWT.decode token, $secret, true, algorithm: 'HS256')[0]
  decoded['username'] && $userlist[decoded['username']] == decoded['password']

rescue
  false
end

def fetchTokenUsername(token)
  decoded = (JWT.decode token, $secret, true, algorithm: 'HS256')[0]
  decoded['username']
end

def sendMessage(message, shouldSave=TRUE)
  for user in $onlineUsers do
    if user.getConnection != nil
      user.getConnection << message
    end
  end
  $messageHistory << message if shouldSave
end

def sendHistory(user)
  for message in $messageHistory
    user.getConnection << message
  end
end

def sendPartMessagesAndUpdateUserList
  messages = []
  for user in $onlineUsers do
    if user.getConnection == nil
      next
    end
    if user.getConnection().closed?
      time =  Time.now.to_f
      messages << "\nevent: Part\ndata: {\"user\": \"#{user.getUserName}\", \"created\": #{time}}\n\n\n"
      print "Selected user #{user.getUserName} for Part\n"
      $onlineUsers = $onlineUsers.select {|_user| _user.getUserName != user.getUserName}
    end
  end

  for message in messages
    #print "Seding Part Message"
    #print message
    sendMessage(message, false)
  end
end

def disconnect(userList)
  for user in userList do
    if user.getConnection == nil
      next
    end
    print "Disconnecting #{user.getUserName}\n"
    time =  Time.now.to_f
    message = "\nevent: Disconnect\ndata: {\"created\": #{time}}\n\n\n"
    user.getConnection << message
    user.getConnection().close()
    $onlineUsers = $onlineUsers.select {|_user| _user.getUserName != user.getUserName}
  end
end

$scheduler.every '3600s' do
  time =  Time.now.to_f
  $uptime += 1
  message = "\nevent: ServerStatus\ndata: {\"status\": \"Server uptime: #{$uptime} hours\", \"created\": #{time}}\n\n\n"

  for user in $onlineUsers do
    user.getConnection << message
  end
  $messageHistory << message
end
#$scheduler.join

before do
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Headers'] = 'accept, authorization, origin'
end

options '*' do
  response.headers['Allow'] = 'HEAD,GET,PUT,DELETE,OPTIONS,POST'
  response.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept, Authorization'
end

post '/login' do
  username = params['username']
  password = params['password']
  if username.nil? || password.nil? || (username == '') || (password == '')
    status 422
    return 'Username or password is blank'
  end
  $userlist[username] = password unless $userlist.key?(username)

  if $userlist[username] == password
    token_payload = { 'username' => username, 'password' => password }
    token = JWT.encode token_payload, $secret, 'HS256'
    status = NEW_LOGIN
    if ($onlineUsers.map {|user| user.getUserName}).include? username
      disconnect($onlineUsers.select {|user| user.getUserName == username})
      status = RE_LOGIN
    end
    newUser = OnlineUser.new(username, nil, status)
    $onlineUsers << newUser
    status 201
    return { 'token' => token }.to_json
  else
    status 403
    return
  end
end

post '/message' do
  sendPartMessagesAndUpdateUserList

  token = ""
  value = request.env["HTTP_AUTHORIZATION"]
  return 403 if value == nil
  authBody = value.split(' ')
  return 403 if authBody.count != 2
  return 403 if authBody[0] != 'Bearer'
  token = authBody[1]

  #puts "\nToken: "+token
  return 403 unless validate_token token
  message = params['message']
  print "message is: #{message}"
  return 422 if message == nil || message == ""
  time =  Time.now.to_f
  username = fetchTokenUsername token
  sendMessage "\nevent: Message\ndata: {\"user\": \"#{username}\", \"created\": #{time}, \"message\": \"#{message}\"}\n\n\n"
  status 201
end

get '/stream/:token', provides: 'text/event-stream' do |_token|
  return 403 unless validate_token _token
  #print "Last event id: #{request.env['HTTP_LAST_EVENT_ID']}\n"
  username = fetchTokenUsername _token
  print "All users: #{$onlineUsers.map {|user| user.getUserName}} \n"
  print "\nrequesting user: #{username}\n"
  user = ($onlineUsers.select {|_user| _user.getUserName == username})[0]
  if user == nil
    return 403
  end

  stream(:keep_open) do |out|
    user.setConnection(out)
    time =  Time.now.to_f

    if user.getStatus != CONNECTED
      sendHistory user
      if user.getStatus == NEW_LOGIN
        sendMessage "event: Join\ndata: {\"user\": \"#{username}\", \"created\": #{time}}\n\n", false
      end
      user.setStatus CONNECTED
    end


    #$onlineUsers = $onlineUsers.select {|user| user.getUserName != username}
    out << "event: Users\n"
    out << "data: {\"users\": #{$onlineUsers.map {|user| user.getUserName}},\n"
    out << "data: \"created\": #{time}}\n\n"
    #sendPartMessagesAndUpdateUserList()
    # purge dead connections
    #$onlineUsers.map {}.reject!(&:closed?)
  end
end
