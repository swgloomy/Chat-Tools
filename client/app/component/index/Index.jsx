import React from 'react';
import '@/css/common/common.pcss';
import './index.pcss';
import style from './index.pcss.json';
import { Button, Input, Modal, Upload } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

class Index extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      userList: { 'qewrqwr': ['qwerqwerq'], 'cxzczv': ['cxvz', 'asd', 'qaweqweq', 'qweqwessasd'] },
      messageList: [],
      selectUser: {
        name: '',
        userId: ''
      },
      message: '',
      visible: true,
      loginUser: '',
      loginUserId: '',
      groupModal: false // 创建讨论组
    };
    this.socket = null;
    this.contentObj = null;
    this.serverHttp = 'http://45.76.205.126:1201';
  }

  componentDidMount () {
    if (Notification && Notification.permission !== 'denied') {
      Notification.requestPermission(function (status) {
        new Notification('新消息', { body: '您有一条新短消息!' });
      });
    }
  }

  initSocket = () => {
    try {
      this.socket = new WebSocket('ws://127.0.0.1:9999/');
      // 用户登录、重连
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({
          'type': 1,
          'message': { type: 1, text: '' },
          'sendUser': '',
          'resultUser': '',
          'userName': this.state.loginUser,
          'userList': {}
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
      // onclose 连接关闭时触发
      this.socket.onclose = () => {
        this.socket = null;
      };
    } catch (e) {
    }
  };
  messageProcess = data => {
    switch (data.type) {
      case 2: // 发消息
        if (Notification && Notification.permission !== 'denied') {
          Notification.requestPermission(function (status) {
            new Notification('新消息提醒', { body: '您有一条新短消息!' });
          });
        }
        this.setState({
          messageList: [
            ...this.state.messageList,
            {
              ...data,
              resultUser: data.sendUser,
              sendUser: data.resultUser
            }
          ]
        }, () => {
          this.contentObj.scrollTo(0, this.contentObj.scrollHeight);
        });
        break;
      case 3:
        let loginUserId = '';
        let userList = {};
        for (const userListKey in data.userList) {
          if (data.userList[userListKey].length === 1 && this.state.loginUser === data.userList[userListKey][0]) {
            loginUserId = userListKey;
          } else {
            userList[userListKey] = data.userList[userListKey];
          }
        }
        this.setState({
          loginUserId,
          userList
        });
        break;
    }
  };
  heartbeat = () => {
    setTimeout(() => {
      this.socket.send(JSON.stringify({
        'type': 5,
        'message': { type: 1, text: '' },
        'sendUser': '',
        'resultUser': '',
        'userName': this.state.loginUser,
        'userList': {}
      }));
      this.heartbeat();
    }, 2000);
  };
  /*
  * 用户列表切换用户
  * */
  switchUser = userId => {
    this.setState({
      selectUser: {
        name: this.state.userList[userId],
        userId: userId
      }
    });
  };
  /*
  * 输入框的change事件
  * */
  messageChange = (e) => {
    const { value } = e.target;
    this.setState({ message: value });
  };
  /*
  * 用户名输入框
  * */
  loginUserChange = e => {
    const { value } = e.target;
    this.setState({ loginUser: value });
  };
  /*
  * 发送按钮的点击事件
  * */
  sendMessage = () => {
    if (this.state.message.length > 0) {
      let sendData = {
        'type': 2,
        'message': { type: 1, text: this.state.message },
        'sendUser': this.state.selectUser.userId,
        'resultUser': this.state.loginUserId,
        'userName': this.state.loginUser,
        'userList': {}
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
  /*
  * 弹窗OK
  * */
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
    let index = 0;
    for (const userListKey in userList) {
      index++;
      domArray.push(
        <div
          key={ userListKey }
          className={ [style.rows, userListKey === this.state.selectUser.userId && style.select].join(' ') }
          /*
           * 左侧用户列表，点击事件=> 用户不等于当前正在聊天的用户，才可点击切换
           *  */
          onClick={ () => {userListKey !== this.state.selectUser.userId && this.switchUser(userListKey);} }>
          <span
            key={ userListKey }
            className={ style.userName }>{ userList[userListKey].length === 1 ? userList[userListKey][0] : `讨论组${ index }` }</span>
        </div>
      );
    }
    return domArray;
  };
  pictureBeforeUpload = file => {
    let form = new FormData();
    form.append('file', file);
    axios({
      method: 'post',
      url: this.serverHttp + '/fileUpload',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: form,
    }).then(res => {
      let sendData = {
        'type': 2,
        'message': { type: 2, text: res.data },
        'sendUser': this.state.selectUser.userId,
        'resultUser': this.state.loginUserId,
        'userName': this.state.loginUser,
        'userList': {}
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
    });
  };
  pictureLoad = () => {
    this.contentObj.scrollTo(0, this.contentObj.scrollHeight);
  };
  showGroup = () => {
    this.setState({
      groupModal: true,
    });
  };
  createGroup = () => {

  };
  addUser = userList => {
/*    let domArray = [];
    let index = 0;
    for (const userListKey in userList) {
      index++;
      domArray.push(
        <div
          key={ userListKey }
          className={ [style.rows, userListKey === this.state.selectUser.userId && style.select].join(' ') }
          onClick={ () => {userListKey !== this.state.selectUser.userId && this.switchUser(userListKey);} }>
          <span
            key={ userListKey }
            className={ style.userName }>{ userList[userListKey].length === 1 ? userList[userListKey][0] : `讨论组${ index }` }</span>
        </div>
      );
    }
    return domArray;*/
  };


  render () {
    return (
      <div className={ style.init }>
        <div className={ style.userList }>
          {
            this.userListDomProcess(this.state.userList)
          }
          <Button type="primary" className={ style.create } onClick={ this.showGroup }>创建讨论组</Button>
        </div>
        <div className={ style.contentArea }>
          {/* 消息列表 */ }
          <div className={ style.content } ref={ el => this.contentObj = el }>
            {
              this.state.messageList.filter(item => item.resultUser === this.state.selectUser.userId || item.sendUser === this.state.selectUser.userId).map((item, index) => {
                if (item.resultUser === this.state.selectUser.userId) {
                  return <div key={ index } className={ style.rows }>
              <span
                className={ style.userMessage }>{ item.message.type === 1 ? item.message.text :
                <img src={ `${ this.serverHttp }/file/${ item.message.text }` } onLoad={ this.pictureLoad }
                     alt=""/> }</span>
                  </div>;
                } else {
                  return <div key={ index } className={ [style.rows, style.customerUser].join(' ') }>
                    <span className={ style.customerService }>{ item.message.type === 1 ? item.message.text :
                      <img src={ `${ this.serverHttp }/file/${ item.message.text }` } onLoad={ this.pictureLoad }
                           alt=""/> }</span>
                  </div>;
                }
              })
            }
          </div>
          {/* 底部输入框 */ }
          <div className={ style.optionArea }>
            <div className={ style.option }>
              <Upload
                accept={ '.jpg,.png,.gif' }
                beforeUpload={ this.pictureBeforeUpload }
                showUploadList={ false }
              >
                <PictureOutlined className={ style.uploadPicture }/>
              </Upload>
            </div>
            <TextArea placeholder="请输入" value={ this.state.message } className={ style.messageInput } rows={ 7 }
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
        <Modal
          title="请添加讨论组成员"
          visible={ this.state.groupModal }
          maskClosable={ false }
          onOk={ this.createGroup }
        >
          {
            console.log('this.state.userList:', this.state.userList)
          }
          {
            this.addUser(this.state.userList)
          }
        </Modal>
      </div>
    );
  }
}

export default Index;
