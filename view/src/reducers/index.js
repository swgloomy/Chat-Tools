import {combineReducers} from 'redux'
import socket from "./socket";
import user from "./user";
import socketMessage from "./socketMessage";
import chat from "./chat";
import expression from "./expression";

export default combineReducers({
  socket,
  user,
  socketMessage,
  chat,
  expression
})
