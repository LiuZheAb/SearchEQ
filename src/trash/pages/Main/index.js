import React, { Component } from 'react';
import axios from "axios";
import Filters from "../../components/Filters";
import FilterTags from "../../components/FilterTags";
import Hits from "../../components/Hits";
import Search from "../../components/Search";
import Sort from "../../components/Sort";
import ViewController from "../../components/ViewController";
import "./index.less";

export default class elasticdemo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            hits: []
        }
    }

    componentDidMount() {
        let _this = this;
        axios.get('http://192.168.2.145:8900/es/getHighLightPage', {
            params: {
                indexName: "earthquake-indexs",
                startPage: "1",
                pageSize: "10",
                highFields: "中国"
            }
        }).then(function (response) {
            _this.setState({ hits: response.data.list })
        }).catch(function (error) { });
    }
    render() {
        return (
            <div id="es">
                <div className="es-header">
                    <div className="header-content">
                        <div className="logo">世界地震信息库</div>
                        <Search />
                    </div>
                </div>
                <div className="es-content">
                    <Filters />
                    <div className="es-main">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="total">共找到581条结果</div>
                            <div style={{ display: "flex" }}>
                                <ViewController />
                                <Sort />
                            </div>
                        </div>
                        <FilterTags />
                        <Hits hits={this.state.hits} />
                    </div>
                </div>
            </div>
        )
    }
}