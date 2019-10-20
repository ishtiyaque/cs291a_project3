# frozen_string_literal: true

require 'sinatra'
require 'json'
require 'jwt'

$userlist = {}
$secret = 'SECRET'
$connections = []

def validate_token(token)
  decoded = (JWT.decode token, $secret, true, algorithm: 'HS256')[0]
  decoded['username'] && $userlist[decoded['username']] == decoded['password']

rescue
  false
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
  print _token
  return 403 unless validate_token _token

  stream(:keep_open) do |out|
    $connections << out

    # purge dead connections
    $connections.reject!(&:closed?)
  end
end
