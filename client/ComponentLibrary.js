import React from 'react';
import classnames from 'classnames';
import CSS from './ComponentLibrary.css';

function basicTag(name, attributes) {
  var tag = { name: name };
  if (attributes) {
    tag.propTypes = attributes;
  }
  return tag;
}

var allowedTags = [
  'div', 'span', 'strong', 'b', 'i', 'em', 'u', 'strike',
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tfoot', 'tbody', 'tr', 'th', 'td', 'caption',
  'ul', 'ol', 'li',
  'pre', 'code',
].reduce((memo, tag) => { memo[tag] = basicTag(tag); return memo; }, {});
allowedTags['a'] = basicTag('a', { href: React.PropTypes.string });
allowedTags['img'] = basicTag('img', { src: React.PropTypes.string });

export class Icon extends React.Component {
  render() {
    return (
      <i className={"fa fa-" + this.props.id} />
    );
  }
}

Icon.propTypes = {
  id: React.PropTypes.string.isRequired,
};

export class MultiColumnList extends React.Component {
  render() {
    let items = React.Children.map(this.props.children, (c, i) =>
      <li key={i}>{c}</li>
    );
    return <ul className="multi-column-list">{items}</ul>;
  }
}

export class File extends React.Component {
  render() {
    let { path, ...other} = this.props;
    return (
      <a href={"cmd://open%20" + path} {...other}>
        {this.props.children || path}
      </a>
    );
  }
}

File.propTypes = {
  path: React.PropTypes.string.isRequired,
  mime: React.PropTypes.string,
};

export class FilePill extends React.Component {
  render() {
    let iconName, icon;
    switch (this.props.mime) {
      case "application/x-directory": iconName = "folder"; break;
      case "application/x-shellscript": iconName = "terminal"; break;
      default: iconName = "file"; break;
    }
    if (iconName) {
      icon = <i className={"fa fa-fw fa-" + iconName} />;
    }
    return <File className="file-pill" {...this.props}>{icon} {this.props.path}</File>;
  }
}

FilePill.propTypes = File.propTypes;

export class FramedImage extends React.Component {
  render() {
    let style = {
      maxWidth: document.body.clientWidth * .8,
      maxHeight: document.body.clientHeight * .8,
    };
    return <img className="framed-image" style={style} src={this.props.src} />;
  }
}

FramedImage.propTypes = {
  src: React.PropTypes.string
};

export default Object.assign({}, allowedTags, {
  'icon': Icon,
  'multi-column-list': MultiColumnList,
  'file-pill': FilePill,
  'framed-image': FramedImage,
});
