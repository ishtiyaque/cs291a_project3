# frozen_string_literal: true

require 'sinatra'
require 'json'
require 'jwt'

set server: 'thin'

$userlist = {}
$secret = 'SECRET'
$onlineUsers = []
$messageHistory = []

class OnlineUser
  def initialize(username, connection)
    # Instance variables
    @username = username
    @connection = connection
  end

  def getUserName
    return @username
  end
  def getConnection
    return @connection
  end
end

def validate_token(token)
  decoded = (JWT.decode token, $secret, true, algorithm: 'HS256')[0]
  decoded['username'] && $userlist[decoded['username']] == decoded['password']

rescue
  false
end

def sendMessage(message, shouldSave=True)
  for user in $onlineUsers do
    user.getConnection << message
  end
  print message
  print shouldSave
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
    if user.getConnection().closed?
      time =  Time.now.to_f
      messages << "\nevent: Part\ndata: {\"user\": \"#{user.getUserName}\", \"created\": #{time}}\n\n\n"
      $onlineUsers = $onlineUsers.select {|_user| _user.getUserName != user.getUserName}
    end
  end

  for message in messages
    print "Seding Part Message"
    print message
    sendMessage(message, false)
  end

end

before do
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Headers'] = 'accept, authorization, origin'
end

options '*' do
  response.headers['Allow'] = 'HEAD,GET,PUT,DELETE,OPTIONS,POST'
  response.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept'
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
    status 201
    return { 'token' => token }.to_json
  else
    status 403
    return
  end
end

get '/stream/:token', provides: 'text/event-stream' do |_token|
  return 403 unless validate_token _token

  decoded = (JWT.decode _token, $secret, true, algorithm: 'HS256')[0]
  username = decoded['username']


  stream(:keep_open) do |out|
    #print "CLass is :#{out.class}\n"
    newUser = OnlineUser.new(username, out)
    time =  Time.now.to_f

    if !($onlineUsers.map {|user| user.getUserName}).include? username
      $onlineUsers = $onlineUsers.select {|user| user.getUserName != username}
      $onlineUsers << newUser
      out << "event: Users\n"
      out << "data: {\"users\": #{$onlineUsers.map {|user| user.getUserName}},\n"
      out << "data: \"created\": #{time}}\n\n"
      sendMessage "event: Join\ndata: {\"user\": \"#{username}\", \"created\": #{time}}\n\n", false

      sendHistory newUser
      sendPartMessagesAndUpdateUserList()
    end
    # purge dead connections
    #$onlineUsers.map {}.reject!(&:closed?)
  end
end
