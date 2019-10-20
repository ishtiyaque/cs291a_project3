require 'sinatra'
require 'json'
require 'jwt'


$userlist = {}
$secret = "SECRET"

post '/login' do
  username = params['username']
  password = params['password']
  if username == nil or password == nil or username == '' or password == ''
    status 422
    return "Username or password is blank"
  end
  if !$userlist.key?(username)
    $userlist[username] = password
  end

  if $userlist[username] == password
    token_payload = {"username" => username, "password" => password}
    token = JWT.encode token_payload, $secret, 'HS256'
    status 201
    return {"token" => token}.to_json
  else
    status 403
    return
  end
end

get '/' do
  "Hello World\n"
end

post '/' do
  require 'pp'
  PP.pp request
  "POST\n"
end
