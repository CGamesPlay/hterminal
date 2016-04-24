import React from 'react';
import io from 'socket.io-client';

const ENTER_KEY_CODE = 13;

console.log("Module evaluated");

export class Cell extends React.Component {
  render() {
    return (
      <div>
        <input
          ref="command"
          onKeyDown={this.handleKeyDown.bind(this)} />
        <div>{this.props.output}</div>
      </div>
    );
  }

  handleKeyDown(e) {
    if (e.keyCode == ENTER_KEY_CODE) {
      e.preventDefault();
      if (this.props.onEvaluate) {
        this.props.onEvaluate(this.refs.command.value);
      }
    }
  }
}

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { output: null };
  }

  componentDidMount() {
    this.socket = io('http://localhost:3000');
    this.socket.on('message', (data) => {
      console.log("message:", data);
    });
  }

  render() {
    return (
      <Cell output={this.state.output} onEvaluate={this.handleEvaluate.bind(this)} />
    );
  }

  handleEvaluate(command) {
    this.socket.send(command);
  }
}
