import React, { Component } from 'react';
import { SearchOutlined } from '@ant-design/icons';

export default class Search extends Component {
    handleSearch = (e) => {
        console.log(e.target.value);
    }
    render() {
        return (
            <div className="search-box">
                <div className="search-icon"><SearchOutlined /></div>
                <input type="text" data-qa="query" className="search-text" onChange={this.handleSearch.bind(this)} placeholder="搜索地震" defaultValue=""></input>
            </div>
        )
    }
}