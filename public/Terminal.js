import React from 'react';
import Driver from './Driver';
import CSS from './Terminal.css';

const ENTER_KEY_CODE = 13;

export class Cell extends React.Component {
  render() {
    return (
      <div>
        <div className={CSS.output}>{this.props.output}</div>
        <input
          ref="command"
          onKeyDown={this.handleKeyDown.bind(this)} />
      </div>
    );
  }

  handleKeyDown(e) {
    if (e.keyCode == ENTER_KEY_CODE) {
      e.preventDefault();
      if (this.props.onEvaluate) {
        this.props.onEvaluate(this.refs.command.value);
      }
      this.refs.command.value = "";
    }
  }
}

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { output: null };
  }

  componentDidMount() {
    this.driver = new Driver();
    this.driver.on('output', (cells) => {
      this.setState({ output: cells[cells.length - 1] });
    });
  }

  render() {
    return (
      <Cell output={this.state.output} onEvaluate={this.handleEvaluate.bind(this)} />
    );
  }

  handleEvaluate(command) {
    this.driver.send(command + "\r");
  }
}
