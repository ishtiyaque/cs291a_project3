import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
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
        console.log(new Date());
        const stream = new EventSource(
            `${axios.defaults.baseURL}/stream/${token}`
        );

        stream.addEventListener(
            'Disconnect',
            (event) => {
                console.log(event);
            }
        );


        stream.addEventListener(
            'Join',
            (event) => {
                console.log(event);
                const { userList } = this.state;
                userList.push(JSON.parse(event.data).user)
                this.setState({ userList: userList.filter((user, pos) => userList.indexOf(user) === pos )});
            }
        );

        stream.addEventListener(
            'Message',
            (event) => {
                console.log(event);
            }
        );

        stream.addEventListener(
            'Part',
            (event) => {
                console.log(event, JSON.parse(event.data).user);
                const { userList } = this.state;
                this.setState({ userList: userList.filter(user => user !== JSON.parse(event.data).user) });
            }
        );

        stream.addEventListener(
            'ServerStatus',
            (event) => {
                console.log(event);
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

    render() {
      return (
        <div className="App">
          <LoginDialog
            setToken={this.setToken}
            open={true}
          />
          <h2>
            CS291 Chat App
          </h2>
          <React.Fragment>
            <CssBaseline />
            <Container maxWidth="xl">
              <Typography component="div" style={{ display: 'flex', flexDirection: 'row',height: '80vh', width: '100%' }}>
                  <Typography
                      component="div"
                      style={{
                          height: '80vh',
                          width: '85%',
                          borderRadius: 10,
                          borderWidth: '2px',
                          borderColor: 'grey',
                          borderStyle: 'solid',
                          marginRight: '5px',
                          marginLeft: '6px'
                      }}
                  >
                  </Typography>
                  <Typography
                      component="div"
                      style={{
                          height: '80vh',
                          width: '15%',
                          borderRadius: 10,
                          borderWidth: '2px',
                          borderColor: 'grey',
                          borderStyle: 'solid',
                          paddingRight: 2
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
                  </Typography>
              </Typography>
              <TextField
                id="outlined-full-width"
                // label="Label"
                style={{ margin: 9, align: 'Left' }}
                placeholder="Write Here!"
                // helperText="Full width!"
                fullWidth
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Container>
          </React.Fragment>
        </div>
      );
    }
}

export default App;
