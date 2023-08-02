const express = require('express');
const app = express();
const { Server } = require('socket.io');
const http = require('http').createServer(app);
const cors = require("cors");
require("dotenv").config();

app.use(cors());
const origin = process.env.CLIENT_URI;
const io = new Server(http, {
    cors: {
        origin: origin,
        //methods: ["POST", 'GET'],
        credentials: true,
    }
})
let users = []; //all users without removing any
let onlineUsers = []; //all online users with remove functionality

/**
 * add a new user only if he is not in the users array. 
 * if he is, remove him and add him again with the new socket id 
 * */
const addUser = (userId, socketId) => {
    const userIndex = users.findIndex(user => user.userId === userId);
    if(userIndex !== -1){
        users.splice(userIndex,1,{userId,socketId});
    }else{
        users.push({userId, socketId});
    }
}
/**
 * add a new user only if he is not in the users array. 
 * if he is, remove him and add him again with the new socket id 
 * this is differnt from the one above because the array is used to track online and offline users
 * */
const addOnlineUser = (userId, socketId) => {
    const userIndex = onlineUsers.findIndex(user => user.userId === userId);
    if(userIndex !== -1){
        onlineUsers.splice(userIndex,1,{userId,socketId});
    }else{
        onlineUsers.push({userId, socketId});
    }
}
/**remove user on disconnect */
const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
} 
/**get the receiver socket id for feedback */
const getReceiverSocketId = (receiverId) => {
    return users.find(user => user.userId === receiverId);
}
/**on user connection */
io.on("connection", (socket) => {
    console.log(`user connected with id: ${socket.id}`);
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        addOnlineUser(userId, socket.id);
        io.emit("onlineUsers", onlineUsers);
    })
    //send message
    socket.on("sendMessage", ({conversationId, senderId, receiverId, text}) => {
        //get receiver socket id
        const receiver = getReceiverSocketId(receiverId);
        io.to(receiver?.socketId).emit("getMessage", {conversationId, senderId, text});
        
    })
   /**when user closes the app or disconnects,
     * update the online users list
    */
    socket.on("disconnect", () => {
        console.log(`userid: ${socket.id} disconnected`);
        removeUser(socket.id);
        io.emit("onlineUsers", onlineUsers);

    })
})
const port = process.env.PORT || 3001;
http.listen(3001, () => {
    console.log(`socket.io server listening on port ${port}`);
})