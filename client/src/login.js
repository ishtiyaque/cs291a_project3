import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import axios from 'axios';

export default function FormDialog(props) {
    const handleLogin = async () => {
        try {
            let server = document.getElementById("server").value;
            let username = document.getElementById("username").value;
            let password = document.getElementById("password").value;
            axios.defaults.baseURL = server;
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);
            let response = await axios.post('/login', params);
            console.log(response);
            props.setToken(response.data.token);
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <div>
            <Dialog open={props.open}  aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Enter server address, username and password
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="server"
                        label="Chat server"
                        type="text"
                        //defaultValue = "http://chat.cs291.com"
                         defaultValue = "http://localhost:4000"  // TO BE REMOVED LATER
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        id="username"
                        label="Username"
                        type="text"
                        defaultValue = "abc"  // TO BE REMOVED LATER
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        defaultValue = "1234"  // TO BE REMOVED LATER
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLogin} color="primary">
                        Login
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}