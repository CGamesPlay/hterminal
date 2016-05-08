import React from 'react';
import CSS from './ComponentLibrary.css';

export class MultiColumnList extends React.Component {
  render() {
    return (
      <ul className={CSS.multiColumnList}>
        {this.props.children}
      </ul>
    );
  }
}

export class FilePill extends React.Component {
  render() {
    return <li className={CSS.filePill}>{this.props.children}</li>;
  }
}

export default {
  'multi-column-list': MultiColumnList,
  'file-pill': FilePill,
};
