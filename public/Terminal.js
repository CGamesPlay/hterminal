import React from 'react';
import Driver from './Driver';
import CSS from './Terminal.css';

const ENTER_KEY_CODE = 13;

export class Cell extends React.Component {
  render() {
    let cell = this.props.cell;

    if (cell.type == "html") {
      let payload = { __html: cell.content };
      return (
        <div className={CSS.htmlOutput} dangerouslySetInnerHTML={payload} />
      );
    } else {
      return (
        <div className={CSS.textOutput}>{cell.content}</div>
      );
    }
  }
}

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.driver = new Driver();
  }

  componentDidMount() {
    this.driver.on('output', (cells) => this.forceUpdate());
  }

  render() {
    let cells = this.driver.cells.map((c, i) =>
      <Cell
        key={i}
        cell={c}
        mutable={i == this.driver.cells.length - 1} />
    );
    return (
      <div>
        {cells}
        <input ref="command" onKeyDown={this.handleKeyDown.bind(this)} />
      </div>
    );
  }

  handleKeyDown(e) {
    if (e.keyCode == ENTER_KEY_CODE) {
      e.preventDefault();
      let command = this.refs.command.value;
      this.driver.send(command + "\r");
      this.refs.command.select();
    }
  }
}
