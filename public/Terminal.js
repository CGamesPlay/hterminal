import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import BottomScroller from './BottomScroller';
import CSS from './Terminal.css';
import debounce from './util/debounce';

function inputFromEvent(event) {
  if (event.type == "keypress") {
    if (event.metaKey) {
      // Don't process OS shortcuts
      return "";
    }
    let charCode = event.keyCode;
    if (charCode < 16 || charCode == 27) {
      // Pass direct for NL, BS, etc
    } else if (charCode < 32) {
      // Modifier key
      return "";
    } else if (charCode >= 64 && charCode < 91) {
      if (!event.shiftKey) {
        charCode += 32;
      }
      if (event.ctrlKey) {
        charCode -= 96;
      }
    }
    return String.fromCharCode(charCode);
  } else if (event.type == "keydown") {
    if (event.keyCode < 16 || event.keyCode == 27) {
      // Control characters on a keyboard. Pass through.
      return String.fromCharCode(event.keyCode);
    } else if (event.code == "Delete") {
      return String.fromCharCode(127);
    } else {
      return "";
    }
  } else {
    return "";
  }
}

export class Section extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  render() {
    let section = this.props.section;

    if (section.type == "html") {
      let payload = { __html: section.content };
      return (
        <div className={CSS.htmlSection} dangerouslySetInnerHTML={payload} onClick={this.handleClick.bind(this)} />
      );
    } else {
      return (
        <div className={CSS.textSection} onClick={this.handleClick.bind(this)}>{section.toString()}</div>
      );
    }
  }

  handleClick(e) {
    if (e.target.tagName == "A") {
      if (e.target.href.startsWith("cmd://")) {
        // This link is a command to run
        e.preventDefault();
        let command = unescape(e.target.href.slice(6));
        if (this.props.onExecute) {
          this.props.onExecute(command);
        }
      }
    }
  }
}

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.delayUpdate = debounce(this.delayUpdate.bind(this), 10);
  }

  componentDidMount() {
    this.props.driver.on('output', this.delayUpdate);
    this.refs.container.addEventListener('keydown', this.handleKeyEvent.bind(this), false);
    this.refs.container.addEventListener('keypress', this.handleKeyEvent.bind(this), false);
    this.refs.container.focus();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.driver !== this.props.driver) {
      newProps.driver.on('output', this.delayUpdate);
    }
  }

  render() {
    let sections = this.props.driver.sections.map((s, i) =>
      <Section
        key={i}
        section={s}
        mutable={i == this.props.driver.sections.length - 1}
        onExecute={this.handleExecute.bind(this)} />
    );
    return (
      <div ref="container" className={CSS.terminal} tabIndex={-1}>
        <BottomScroller ref="scroller" className={CSS.terminalContents}>
          {sections}
        </BottomScroller>
      </div>
    );
  }

  handleKeyEvent(e) {
    var input = inputFromEvent(e);
    if (input.length > 0) {
      e.preventDefault();
      this.refs.scroller.scrollToBottom();
      this.props.onInput(input);
    }
  }

  handleExecute(command) {
    this.props.onInput(command + "\r");
  }

  delayUpdate() {
    this.forceUpdate();
  }
}
