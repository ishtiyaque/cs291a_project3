import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import LoginDialog from './login';
import './App.css';

class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            token: null,
            userList: [],
            messageList: [],
        };
    }

    setToken = token => {
        this.setState({ token });
        this.start_stream(token);
    };

    start_stream = (token) => {
        console.log("Begin: ");
        //console.log(new Date());
        const stream = new EventSource(
            `${axios.defaults.baseURL}/stream/${token}`
        );

        stream.addEventListener(
            'Disconnect',
            (event) => {
                console.log(event);
                stream.close();
                this.setState({ token: null, userList: [], messageList: [] });
            }
        );


        stream.addEventListener(
            'Join',
            (event) => {
                console.log(event);
                const { userList, messageList } = this.state;
                const data = JSON.parse(event.data);
                userList.push(data.user)
                messageList.push({ createdAt: data.created, message: data.user, event: 'Join' });
                this.setState({ userList: userList.filter((user, pos) => userList.indexOf(user) === pos ), messageList});
            }
        );

        stream.addEventListener(
            'Message',
            (event) => {
                const { messageList } = this.state;
                const data = JSON.parse(event.data);
                messageList.push({ createdAt: data.created, message: `(${data.user}) ${data.message}`, event: 'Message' });

                this.setState({ messageList});
            }
        );

        stream.addEventListener(
            'Part',
            (event) => {
                console.log(event, JSON.parse(event.data).user);
                const data = JSON.parse(event.data);
                const { userList, messageList } = this.state;
                messageList.push({ createdAt: data.created, message: data.user, event: 'Part' });
                this.setState({ userList: userList.filter(user => user !== JSON.parse(event.data).user), messageList });
            }
        );

        stream.addEventListener(
            'ServerStatus',
            (event) => {
                console.log(event);
                const { messageList } = this.state;
                const data = JSON.parse(event.data);
                messageList.push({ createdAt: data.created, message: data.status, event: 'Message' });

                this.setState({ messageList});
            }
        );

        stream.addEventListener(
            'Users',
            (event) => {
                console.log(event.data);
                const userList = JSON.parse(event.data).users;
                this.setState({ userList: userList.filter((user, pos) => userList.indexOf(user) === pos )});
            }
        );
    };

    sendMessage = () => {
        const message = document.getElementById("message").value;
        if (message) {
            console.log(message);

            var form = new FormData();
            form.append("message", message);

            var request = new XMLHttpRequest();
            request.open("POST", axios.defaults.baseURL + "/message");
            request.setRequestHeader(
                "Authorization",
                "Bearer " + this.state.token
            );
            request.send(form);

            document.getElementById("message").value = "";
        }
    }

    render() {
      return (
        <div className="App">
          <LoginDialog
            setToken={this.setToken}
            open={!this.state.token}
          />
          <h2>
            CS291 Chat App
          </h2>
          <React.Fragment>
            <CssBaseline />
            <Container maxWidth="xl">
              <Typography component="div" style={{ display: 'flex', flexDirection: 'row',height: '80vh', width: '100%' }}>
                  <Paper
                      component="div"
                      style={{
                          height: '80vh',
                          width: '85%',
                          borderRadius: 10,
                          borderWidth: '2px',
                          borderColor: 'grey',
                          borderStyle: 'solid',
                          marginRight: '5px',
                          marginLeft: '6px',
                          maxHeight: '80vh',
                          overflow: 'auto'
                      }}
                  >
                      <div style={{ padding: 2 }} />
                      {this.state.messageList.map(({createdAt, event, message}) =>
                          <Typography variant="body1" display="block" gutterBottom key={createdAt}
                                      style={{textAlign: 'left', paddingLeft: 5}}>
                              {new Date(Math.round(createdAt*1000)).toLocaleString()} {event.toUpperCase()}: {message}
                          </Typography>
                      )}
                  </Paper>
                  <Paper
                      component="div"
                      style={{
                          height: '80vh',
                          width: '15%',
                          borderRadius: 10,
                          borderWidth: '2px',
                          borderColor: 'grey',
                          borderStyle: 'solid',
                          paddingRight: 2,
                          maxHeight: '80vh',
                          overflow: 'auto'
                      }}
                  >
                      <h3 style={{ textAlign: 'center', borderWidth: '0px 0px 2px 0px', borderStyle: 'solid', margin: 5, borderColor: 'grey' }} >Users</h3>
                      {this.state.userList.map(user =>
                          <div style={{ width: '100%' }} key={user} >
                              <Chip
                                  avatar={<Avatar>{user[0].toUpperCase()}</Avatar>}
                                  label={user}
                                  variant="outlined"
                                  style={{ margin: '4px 0px' }}
                              />
                          </div>
                      )}
                  </Paper>
              </Typography>
              <TextField
                id="message"
                // label="Label"
                style={{ margin: 9, align: 'Left', width: '90%' }}
                placeholder="Write Here!"
                // helperText="Full width!"
                fullWidth
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                onKeyPress={(ev) => {
                    console.log(`Pressed keyCode ${ev.key}`);
                    if (ev.key === 'Enter') {
                        this.sendMessage();
                        ev.preventDefault();
                    }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                style={{ marginTop: 10, height: 50 }}
                // className={classes.button}
                // endIcon={<Icon>send</Icon>}
                onClick={this.sendMessage}
              >
                Send
              </Button>
            </Container>
          </React.Fragment>
        </div>
      );
    }
}

export default App;
