let io;

module.exports = {
    init: httpServer => {//init is a user defined name, short for initialize
        io = require('socket.io')(httpServer);
        return io;
    },

    getIo: ()=> {
        if(!io){
            throw new Error('Socket.io not initalised');
        }

        return io;
    }
}