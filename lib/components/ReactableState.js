import React from 'react';
import createReactClass from 'create-react-class';

ReactableState = createReactClass({

  propTypes: ReactableConfigShape,

  mixins: [ ReactMeteorData ],

  getDefaultProps () {
    return {
      stateManager: DefaultStateManager,
    };
  },

  getInitialState () {
    let state = {
      stateManager: this.props.stateManager(),
    };
    if (state.stateManager.track) {
      state.stateDependency = new Tracker.Dependency();
    }
    return state;
  },

  getMeteorData () {
    if (this.state.stateDependency) {
      this.state.stateDependency.depend();
    }
    return {
      l: this.getLimit(),
      p: this.getPage(),
      s: this.getSort(),
    };
  },

  render () {
    let props = { ...this.props };
    delete props.children;
    delete props.stateManager;

    props.sort = this.data.s || this.defaultSort();
    if (this.props.paginate) {
      props.paginate = {
        limit: this.data.l || this.props.paginate.defaultLimit,
        page:  this.data.p || this.props.paginate.defaultPage || 1,
        defaultLimit:   this.props.paginate.defaultLimit,
        serverSide:     this.props.paginate.serverSide,
      };
      if (this.props.paginate.ui) {
        props.paginate.ui = this.props.paginate.ui;
      }
      props.onChangePaginate = this.setPaginate;
    };

    props.onHeadCellClick = this.onHeadCellClick;

    return (
      <ReactableData { ...props }/>
    );
  },

  defaultSort () {
    let defaultSort   = null;
    let firstSortable = null;

    let column = -1;
    let sort;
    this.props.fields.some(field => {
      ++column;

      if (firstSortable === null && field.sort) {
        const direction = typeof field.sort === 'object' ? field.sort.direction : field.sort;
        firstSortable = { column, direction };
      }

      if (typeof field.sort !== 'object') return false;
      if (!field.sort.default)            return false;
      sort = {
        column:    column,
        direction: field.sort.direction || 1,
      };
      return true;
    });
    return sort || firstSortable;
  },

  get (k) {
    return this.state.stateManager.get.call(this, k);
  },

  set (o) {
    this.state.stateManager.set.call(this, o);
    if (this.state.stateDependency) {
      this.state.stateDependency.changed();
    }
  },

  getLimit() {
    const { paginate={} } = this.props;
    let limit = parseInt(this.get('l'));
    limit = isNaN(limit) ? paginate.limit : limit;
    return limit && limit > 0 ? limit : null;
  },

  getPage() {
    const { paginate={} } = this.props;
    let page = parseInt(this.get('p'));
    page = isNaN(page) ? paginate.page : page;
    return page && page > 0 ? page : null;
  },

  setPaginate (opt) {
    if (!this.props.paginate) return;
    limit = parseInt(opt.limit);
    page  = parseInt(opt.page);
    if (isNaN(limit) || limit < 1) limit = null;
    if (isNaN(page)  || page  < 1) page  = null;
    let changes = {};
    if (opt.limit) changes.l = limit;
    if (opt.page)  changes.p = page;

    /**
     * Delete defaults from the stateManager
     */
    const { defaultPage=1, defaultLimit } = this.props.paginate;
    if (changes.p === defaultPage)  changes.p = null;
    if (changes.l === defaultLimit) changes.l = null;

    /**
     * When we change the limit, do some magic to recalculate the page
     * number we're viewing too so that the top row on the old page
     * still exists somewhere on the new page.
     */
    if (changes.l && !changes.p) {
      const cur_page  = this.data.p;
      const cur_limit = this.data.l;
      let top_row  = ((cur_limit * (cur_page - 1)) + 1);
      let newPage  = Math.ceil(top_row / limit);
      if (newPage !== page) changes.p = newPage;
    }

    if (Object.keys(changes).length) {
      this.set(changes);
    }
  },

  getSort () {
    const sort = this.get('s');
    if (typeof sort !== 'string') return null;
    const matcher = sort.match(/^(-)?(.+)$/);
    if (!matcher) return null;

    const direction = matcher[1] ? -1 : 1;
    let column = matcher[2];

    for (let i = 0; i < this.props.fields.length; ++i) {
      if (this.props.fields[i].name == column) {
        column = i;
        break;
      }
    }
    if (typeof column === 'string') column = parseInt(column)||0;

    if (column >= this.props.fields.length) return null;
    if (!this.props.fields[ column ].sort) return null;

    return { column, direction }
  },

  setSort (sort) {
    let s = this.props.fields[ parseInt(sort.column) ].name || sort.column;
    if (sort.direction < 0) s = `-${s}`;
    this.set({ s });
  },

  onHeadCellClick (column) {
    const field = this.props.fields[ column ];

    if (!field.sort) return;

    let sort_spec = field.sort;
    let sort      = this.data.s || this.defaultSort();

    if (sort.column === column) {
      sort.direction *= -1;
    } else {
      sort.column    = column;
      sort.direction = sort_spec.direction || 1;
    }

    this.setSort(sort);
  },

});
