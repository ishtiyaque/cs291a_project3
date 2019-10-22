import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import LoginDialog from './login';
import './App.css';

class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            token: null
        };
    }

    setToken = token => {
        this.setState({ token });
        axios.get(`/stream/${token}`);
    };

    start_stream = () => {
        const stream = new EventSource(
            sessionStorage.url + "/stream/" + sessionStorage.accessToken
        );

        stream.addEventListener(
            'Hey',
            (event) => {
                console.log(event);
            }
        )
        
    }

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
