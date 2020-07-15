import React from 'react';
import '@/css/common/common.pcss';
import './index.pcss';
import style from './index.pcss.json';
import { Button, Input, Modal } from 'antd';

const { TextArea } = Input;

class Index extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      userList: { 'qewrqwr': 'qwerqwerq', 'cxzczv': 'cxvz' },
      messageList: [],
      selectUser: {
        name: '',
        userId: ''
      },
      message: '',
      visible: true,
      loginUser: '',
      loginUserId: ''
    };
    this.socket = null;
    this.contentObj = null;
  }

  initSocket = () => {
    try {
      this.socket = new WebSocket('ws://127.0.0.1:9999/');
      // 用户登录、重连
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({
          'type': 1,
          'message': '',
          'sendUser': '',
          'resultUser': '',
          'userName': this.state.loginUser,
          'userList': []
        }));
        this.heartbeat();
      };
      // 接收消息
      this.socket.onmessage = res => {
        this.messageProcess(JSON.parse(res.data));
      };
      // 连接错误: 重连
      this.socket.onerror = () => {
        //this.initSocket();
      };
      this.socket.onclose = () => {
        this.socket = null;
      };
    } catch (e) {
    }
  };
  messageProcess = data => {
    switch (data.type) {
      case 2:
        this.setState({
          messageList: [
            ...this.state.messageList,
            data
          ]
        }, () => {
          this.contentObj.scrollTo(0, this.contentObj.scrollHeight);
        });
        break;
      case 3:
        let loginUserId = '';
        for (const userListKey in data.userList) {
          if (this.state.loginUser === data.userList[userListKey]) {
            loginUserId = userListKey;
          }
        }
        this.setState({
          loginUserId,
          userList: data.userList
        });
        break;
    }
  };
  heartbeat = () => {
    setTimeout(() => {
      this.socket.send(JSON.stringify({
        'type': 5,
        'message': '',
        'sendUser': '',
        'resultUser': '',
        'userName': this.state.loginUser,
        'userList': []
      }));
      this.heartbeat();
    }, 2000);
  };
  switchUser = userId => {
    this.setState({
      selectUser: {
        name: this.state.userList[userId],
        userId: userId
      }
    });
  };
  messageChange = (e) => {
    const { value } = e.target;
    this.setState({ message: value });
  };
  loginUserChange = e => {
    const { value } = e.target;
    this.setState({ loginUser: value });
  };
  sendMessage = () => {
    if (this.state.message.length > 0) {
      let sendData = {
        'type': 2,
        'message': this.state.message,
        'sendUser': this.state.selectUser.userId,
        'resultUser': this.state.loginUserId,
        'userName': this.state.loginUser,
        'userList': []
      };
      this.socket.send(JSON.stringify(sendData));
      this.setState({
        message: '',
        messageList: [
          ...this.state.messageList,
          sendData
        ]
      }, () => {
        this.contentObj.scrollTo(0, this.contentObj.scrollHeight);
      });
    }
  };
  handleOk = () => {
    if (this.state.loginUser.trim()) {
      this.setState({
        loginUser: this.state.loginUser.trim(),
        visible: false
      }, () => {
        this.initSocket();
      });
    }
  };
  userListDomProcess = userList => {
    let domArray = [];
    for (const userListKey in userList) {
      domArray.push(
        <div
          key={ userListKey }
          className={ [style.rows, userListKey === this.state.selectUser.userId && style.select].join(' ') }
          onClick={ () => {userListKey !== this.state.selectUser.userId && this.switchUser(userListKey);} }>
          <span
            key={ userListKey }
            className={ style.userName }>{ userList[userListKey] }</span>
        </div>
      );
    }
    return domArray;
  };

  render () {
    return (
      <div className={ style.init }>
        <div className={ style.userList }>
          {
            this.userListDomProcess(this.state.userList)
          }
        </div>
        <div className={ style.contentArea }>
          <div className={ style.content } ref={ el => this.contentObj = el }>
            {
              this.state.messageList.filter(item => item.resultUser === this.state.selectUser.userId || item.sendUser === this.state.selectUser.userId).map((item, index) => {
                if (item.resultUser === this.state.selectUser.userId) {
                  return <div key={ index } className={ style.rows }>
              <span
                className={ style.userMessage }>{ item.message }</span>
                  </div>;
                } else {
                  return <div key={ index } className={ [style.rows, style.customerUser].join(' ') }>
                    <span className={ style.customerService }>{ item.message }</span>
                  </div>;
                }
              })
            }
          </div>
          <div className={ style.optionArea }>
            <TextArea placeholder="请输入" value={ this.state.message } className={ style.messageInput } rows={ 8 }
                      onChange={ this.messageChange } onPressEnter={ this.sendMessage }/>
            <Button onClick={ this.sendMessage } type="primary">发送</Button>
          </div>
        </div>
        <Modal
          title="请输入登陆用户名"
          visible={ this.state.visible }
          maskClosable={ false }
          onOk={ this.handleOk }
        >
          <Input value={ this.state.loginUser } placeholder="登陆用户名" maxLength={ 8 } onChange={ this.loginUserChange }/>
        </Modal>
      </div>
    );
  }
}

export default Index;
