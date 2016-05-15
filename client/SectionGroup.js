import React from 'react';
import ReactDOM from 'react-dom';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import classnames from 'classnames';
import { parseHTML } from './HTMLParser';
import './SectionGroup.css';

export class SectionGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { collapsed: false };

    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    this.forceUpdate = this.forceUpdate.bind(this);
  }

  componentDidMount() {
    this.addListenersToGroup(this.props.group);
  }

  componentWillUnmount() {
    this.removeListenersFromGroup(this.props.group);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.group !== this.props.group) {
      this.removeListenersFromGroup(this.props.group);
      this.addListenersToGroup(newProps.group);
    }
  }

  addListenersToGroup(group) {
    group.on('update', this.forceUpdate);
  }

  removeListenersFromGroup(group) {
    group.removeListener('update', this.forceUpdate);
  }

  render() {
    let group = this.props.group, controls;
    let sections = group.sections.map((s, i) =>
      <Section
        key={i}
        section={s}
        readOnly={this.props.readOnly || i != this.props.group.sections.length - 1}
        onExecute={this.props.onExecute} />
    );

    if (group.isFinished()) {
      controls = (
        <GroupControls
          collapsed={this.state.collapsed}
          onToggleCollapse={this.handleCollapse.bind(this)}
          onCopy={this.handleCopy.bind(this)} />
      );
    }

    let className = classnames("group", {
      "status-success": group.isSuccess(),
      "status-error": group.isFinished() && !group.isSuccess(),
      "status-running": group.isRunning(),
      "status-waiting-for-command": group.isPrompt(),
    }, this.state.collapsed && "group-collapsed");
    return (
      <div className={className}>{controls}{sections}</div>
    );
  }

  handleCollapse(collapsed) {
    this.setState({ collapsed: collapsed });
  }

  handleCopy() {
    let selection = window.getSelection(),
        range = document.createRange(),
        node = ReactDOM.findDOMNode(this);
    range.setStartBefore(node.firstChild.nextSibling);
    range.setEndAfter(node.lastChild);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
  }
}

export class GroupControls extends React.Component {
  render() {
    let collapseWord = "Collapse", collapseIcon = "compress";
    if (this.props.collapsed) {
      collapseWord = "Expand";
      collapseIcon = "expand";
    }
    return (
      <div className="group-controls">
        <i className="fa fa-bars group-controls-trigger" />
        <div className="group-controls-actions">
          <button onClick={this.handleCollapse.bind(this)} title={collapseWord + " the output from this command"}>
            <i className={"fa fa-" + collapseIcon} />
          </button>
          <button onClick={this.handleCopy.bind(this)} title="Copy the output of this command">
            <i className="fa fa-clipboard" />
          </button>
        </div>
      </div>
    );
  }

  handleCopy(e) {
    e.preventDefault();
    if (this.props.onCopy) {
      this.props.onCopy();
    }
  }

  handleCollapse(e) {
    e.preventDefault();
    if (this.props.onToggleCollapse) {
      this.props.onToggleCollapse(!this.props.collapsed);
    }
  }
}

export class Section extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.section !== nextProps.section || !this.props.readOnly;
  }

  componentDidUpdate() {
    if (this.props.onUpdate) {
      this.props.onUpdate();
    }
  }

  render() {
    let { className, section, readOnly, ...other } = this.props;

    if (section.type == "html") {
      let payload = parseHTML(section.content);
      return (
        <div className={classnames(className, "html-section", section.className)}
          onClick={this.handleClick.bind(this)}
          {...other}>
          {payload}
        </div>
      );
    } else {
      var payload = section.toHTML();
      return (
        <div className={classnames(className, "text-section", section.className)}
          dangerouslySetInnerHTML={payload}
          onClick={this.handleClick.bind(this)}
          {...other} />
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
