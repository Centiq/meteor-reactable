import React     from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const DefaultRow = createReactClass({
  render () {
    return (
      <tr className={ this.props.classes }>
        { this.props.children }
      </tr>
    );
  },
});

ReactableTableRow = createReactClass({

  mixins: [ ReactableClasses ],

  propTypes: {
    row: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.array,
      PropTypes.func,
      PropTypes.object,
    ]),
    classes:   ReactableTypeClasses,
    tr:        PropTypes.func, // React class
    fields:    PropTypes.arrayOf(ReactableTypeField).isRequired,
    row:       PropTypes.object.isRequired,
    rowNumber: PropTypes.number.isRequired,
  },

  render () {
    let colNumber = 0;
    const cells = this.props.fields.map(field => {
      let value;

      if (field.hasOwnProperty('name')) {

        let name = field.name;
        let row  = this.props.row;

        while (true) {
          const i = name.indexOf('.');
          if (i === -1) break;
          const head = name.substr(0, i);
          name = name.substr(i + 1);
          if (row.hasOwnProperty(head) && typeof row[ head ] === 'object') {
            row = row[ head ];
          } else {
            value = null;
          }
        }

        if (typeof value === 'undefined') {
          value = row[ name ];
        }
      }

      let classes = this.getClasses([field.tdClasses], value);

      if (field.hasOwnProperty('transform')) {
        value = field.transform.call({ row: this.props.row }, value);
      }

      if (value !== null && typeof value === 'object') {
        value = value.toString();
      }

      if (value === null || typeof value === 'undefined') {
        value = '';
      }

      const TableCell = field.hasOwnProperty('td') ? field.td : ReactableTableCell;

      let cellProps = {
        row:       this.props.row,
        rowNumber: this.props.rowNumber,
        colNumber: colNumber++,
        label:     field.label,
      };

      if (field.hasOwnProperty('tdInner')) {
        const Inner = field.tdInner;
        value = (
          <Inner {...cellProps}>
            { value }
          </Inner>
        );
      }

      return (
        <TableCell { ...cellProps} classes={ classes }>
          { value }
        </TableCell>
      );
    });

    const Row = this.props.tr || DefaultRow;
    return React.createElement(Row, {
      classes:   this.getClasses([this.props.classes]),
      fields:    this.props.fields,
      row:       this.props.row,
      rowNumber: this.props.rowNumber,
    }, ...cells);
  },
});
