/*
 *文件名 : App.js
 *作者 : 刘哲
 *创建时间 : 2020/8/17
 *文件描述 : ElasticSearch前端主体功能及界面
 */

import React, { Component } from 'react';
import axios from "axios";
import moment from 'moment';
import 'moment/locale/zh-cn';
import zhCN from 'antd/es/locale/zh_CN';
import locale from 'antd/es/date-picker/locale/zh_CN';
import Map from 'react-amap/lib/map';
import Marker from 'react-amap/lib/marker';
import { ConfigProvider, DatePicker, Tag, Button, Input, InputNumber, Checkbox, Radio, Empty, Pagination, Modal, Slider, Result, Skeleton, Row, Col, Drawer, Table, AutoComplete } from "antd";
import { LoadingOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route } from "react-router-dom";
import globalCountrys from "./countrys";
import {
    devUrl, devIndexName,
    // proUrl, proIndexName,
    docUrl, visUrl, kibanaUrl, getArticle, articleUrl, bingUrl
} from "./api.json";
import "./index.less";

const url = devUrl, indexName = devIndexName;
const { Search } = Input, { RangePicker } = DatePicker;
const magnitudeFilter = ["<= 3", ">= 3", ">= 4", ">= 5", ">= 6", ">= 7"],
    countryFilter = ["中国", "美国", "日本", "印度尼西亚", "智利", "新西兰"],
    timeFilter = ['最近24小时', "最近一周", "最近一个月"],
    depthFilter = ['= -1', "0 - 60", "60 - 300", ">= 300"],
    skeletonList = [], skeletonGrid = [], skeletonTable = [];
for (let i = 0; i < 12; i++) {
    skeletonList.push(
        <div key={i} className="skeleton-list"> 
            <Skeleton active />
            <Skeleton.Image />
        </div>
    );
    skeletonGrid.push(
        <div key={i} className="skeleton-grid">
            <Skeleton.Image />
            <Skeleton active />
        </div>
    );
    skeletonTable.push(
        <div key={i} className="skeleton-table-item">
            <Skeleton.Input active size="small" />
        </div>
    );
}
const disabledDate = current => current && current > moment();
const s = `
.......  ...... ....... ....... .......         ....... ... ...  ......
....... ....... ... ... ....... .......         ....... ... ... .......
  ...   ...     ... ... ...     ...             ...     ... ... ...
  ...   ......  ....... ....... ...     ....... ....... ... ... ......
  ...    ...... ...     ....... ...     ....... ....... .......  ......
  ...       ... ...     ...     ...             ...      .....      ...
....... ....... ...     ....... .......         .......   ...   .......
....... ......  ...     ....... .......         .......    .    ......
`;
const d = s.split('\n').map((row, irow) => row.length ? row.split('').map((char, icol) => char.trim() ? `M${2 * icol + 1} ${2 * (irow - 1) + 1} v1 h1 v-1 h1 Z` : '').join(' ') : '').join('\n');
const menuD = "M 904 160 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z m 0 624 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z m 0 -312 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z";

class elasticdemo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: true,
            loading: false,
            keyword: this.props.location.search ? decodeURIComponent(this.props.location.search.split("?")[1]) : "",
            resultKey: "",
            hits: null,
            options: [],
            countrysSelected: [],
            countrysSelectedDrawer: [],
            magnitudeSelected: null,
            timeSelected: null,
            countryDrawerVisible: false,
            magModalVisible: false,
            timeModalVisible: false,
            depthModalVisible: false,
            startPage: 1,
            pageSize: 12,
            total: 0,
            minNum: null,
            maxNum: null,
            magSliderValue: [2, 9],
            startTime: undefined,
            endTime: undefined,
            datePickerValue: [undefined, undefined],
            viewType: "list",
            menuDrawerVisible: false,
            collapsed: false,
            startDepth: null,
            endDepth: null,
            depthSelected: null,
            depSliderValue: [null, null],
            timeSort: null,
            minMatch: 0,
            articleLoading: false,
            articleList: [],
            relatedKeywords: [],
            fullScreen: false,
            fullScreenVisible: true
        };
        const _this = this;
        this.mapEvents = {
            created(map) {
                _this.map = map;
                _this.map.setLayers([
                    new window.AMap.TileLayer.Satellite(),
                    new window.AMap.TileLayer.RoadNet(),
                ]);
            }
        };
    }
    componentDidMount() {
        window.addEventListener('resize', this.handleResize.bind(this)) //监听窗口大小改变
        this.handleClientW(window.innerWidth);
        this.submitSearch();
        let system = {
            win: false,
            mac: false,
            x11: false
        };
        let p = navigator.platform;
        system.win = p.indexOf("Win") === 0;
        system.mac = p.indexOf("Mac") === 0;
        system.x11 = (p === "X11") || (p.indexOf("Linux") === 0);
        if (system.win || system.mac || system.x11) {
            //电脑端
            this.setState({
                fullScreenVisible: true
            });
        } else {
            //移动端
            this.setState({
                fullScreenVisible: false
            });
        }
    }
    //比较窗口与1024px大小
    handleClientW = width => {
        this.setState({
            collapsed: width <= 1024
        })
    }
    handleResize = e => {
        this.handleClientW(e.target.innerWidth);
    }
    // 发起搜索请求，提交各项参数
    submitSearch = (pageNum, string) => {
        let { keyword, minNum, maxNum, startTime, endTime, pageSize, countrysSelected, countrysSelectedDrawer, startDepth, endDepth, timeSort, minMatch } = this.state;
        let _this = this;
        this.setState({
            status: true,
            loading: true,
            articleLoading: true,
            hits: null,
            startPage: pageNum ? pageNum : 1,
            resultKey: string ? string : keyword
        });
        countrysSelected.map(tag => keyword += tag);
        countrysSelectedDrawer.map(tag => keyword += tag);
        axios.get(url + "/getHighLightPage", {
            params: {
                indexName,
                startPage: pageNum ? pageNum : 1,
                pageSize,
                highFields: keyword,
                minNum,
                maxNum,
                startDepth,
                endDepth,
                startTime,
                endTime,
                timeSort,
                minMatch: minMatch / 100
            }
        }).then(response => {
            let { list, total } = response.data;
            _this.setState({
                status: true,
                loading: false,
                hits: list,
                total: total
            });
        }).catch(() => {
            _this.setState({
                loading: false,
                status: false
            });
        });

        axios.get(`${docUrl}?dataType=%E6%9C%9F%E5%88%8A%E8%AE%BA%E6%96%87&pn=1&expand=(+keywords:*断裂*++OR+keywords:*地震*++AND+name:*${keyword}地震*++AND+year:[+2013+TO+2021+])&searchParam=&seconSearchValue=&orderType=relation`, {
        }).then(response => {
            let { keywordsMap } = response.data;
            let keysSorted = Object.keys(keywordsMap).sort((a, b) => keywordsMap[b] - keywordsMap[a]);
            _this.setState({
                articleList: response.data.result,
                relatedKeywords: keysSorted.splice(0, 10),
                articleLoading: false
            });
        }).catch(() => {
            _this.setState({
                articleLoading: false
            });
        });
    }
    //修改搜索框内容
    handleKeywordChange = e => {
        let { value } = e.target;
        this.setState({ keyword: value }, () => this.getSearchHintList());
    }
    //获取搜索提示框内容
    getSearchHintList = () => {
        let { keyword } = this.state;
        if (keyword === "") {
            this.setState({ options: [] });
        } else {
            let _this = this;
            axios.get(url + "/getTitleTip", {
                params: {
                    indexName,
                    highFields: keyword,
                }
            }).then(function (response) {
                let hintList = response.data, options = [];
                if (hintList) {
                    options = hintList.map((item, index) => {
                        return {
                            value: item.nhlWord,
                            key: index,
                            label: <span dangerouslySetInnerHTML={{ __html: item.hlWord }} />
                        }
                    });
                }
                _this.setState({ options });
            }).catch(function (error) { });
        }
    }
    //点击搜索图标或按Enter键调用，发起搜索请求
    searchHandler = value => {
        this.props.history.push(this.state.keyword ? "/s?" + this.state.keyword : "/");
        this.submitSearch(undefined, value);
    }
    //控制菜单抽屉是否显示
    handleMenuClose = () => {
        let { menuDrawerVisible } = this.state;
        this.setState({ menuDrawerVisible: !menuDrawerVisible })
    }
    //修改类型、国家、地震带筛选项调用
    filtersHandler = (key, value) => {
        this.setState({ [key]: value }, () => this.submitSearch());
    }
    //修改震级筛选项调用
    magnitudeHandler = e => {
        let { minNum, maxNum } = this.state;
        switch (e.target.value) {
            case "<= 3":
                minNum = null;
                maxNum = 3;
                break;
            case ">= 3":
                minNum = 3;
                maxNum = null;
                break;
            case ">= 4":
                minNum = 4;
                maxNum = null;
                break;
            case ">= 5":
                minNum = 5;
                maxNum = null;
                break;
            case ">= 6":
                minNum = 6;
                maxNum = null;
                break;
            case ">= 7":
                minNum = 7;
                maxNum = null;
                break;
            default:
                minNum = null;
                maxNum = null;
                break;
        };
        this.setState({
            minNum,
            maxNum,
            magnitudeSelected: e.target.value,
            magSliderValue: [minNum, maxNum],
        }, () => this.submitSearch());
    }
    //修改地震活动时间筛选项调用
    timeHandler = e => {
        let { startTime, endTime } = this.state;
        let currentTimeStamp = new Date().getTime();
        switch (e.target.value) {
            case "最近24小时":
                startTime = currentTimeStamp - 24 * 60 * 60 * 1000;
                endTime = currentTimeStamp;
                break;
            case "最近一周":
                startTime = currentTimeStamp - 7 * 24 * 60 * 60 * 1000;
                endTime = currentTimeStamp;
                break;
            case "最近一个月":
                startTime = currentTimeStamp - 30 * 24 * 60 * 60 * 1000;
                endTime = currentTimeStamp;
                break;
            default:
                startTime = undefined;
                endTime = undefined;
        }
        this.setState({
            timeSelected: e.target.value,
            startTime,
            endTime
        }, () => this.submitSearch());
    }
    //修改震源深度筛选项调用
    depthHandler = e => {
        let { startDepth, endDepth } = this.state;
        switch (e.target.value) {
            case "= -1":
                startDepth = -1;
                endDepth = -1;
                break;
            case "0 - 60":
                startDepth = 0;
                endDepth = 60;
                break;
            case "60 - 300":
                startDepth = 60;
                endDepth = 300;
                break;
            case ">= 300":
                startDepth = 300;
                endDepth = null;
                break;
            default:
                startDepth = null;
                endDepth = null;
                break;
        };
        this.setState({
            startDepth,
            endDepth,
            depthSelected: e.target.value,
            depSliderValue: [startDepth, endDepth],
        }, () => this.submitSearch());
    }
    //清空国家筛选项
    clearFilters = () => {
        this.setState({
            countrysSelected: [],
            countrysSelectedDrawer: []
        }, () => this.submitSearch());
    }
    //清空震级或地震活动时间筛选项
    clearOption = name => {
        switch (name) {
            case "magnitude":
                this.setState({
                    minNum: null,
                    maxNum: null,
                    magnitudeSelected: null,
                }, () => this.submitSearch());
                break;
            case "time":
                this.setState({
                    timeSelected: null,
                    startTime: undefined,
                    endTime: undefined,
                }, () => this.submitSearch());
                break;
            case "depth":
                this.setState({
                    startDepth: null,
                    endDepth: null,
                    depthSelected: null,
                }, () => this.submitSearch());
                break;
            default:
                break;
        }
    }
    //弹出所有国家抽屉调用
    showCountryDrawer = () => {
        this.setState({ countryDrawerVisible: true });
    }
    //抽屉选择国家时调用
    handleCountrySelectedDrawer = value => {
        this.setState({ countrysSelectedDrawer: value }, () => this.submitSearch());
    }
    //关闭所有国家抽屉调用
    handleCountryClose = () => {
        this.setState({ countryDrawerVisible: false });
    }
    //弹出自定义震级模态框调用
    showMagModal = () => {
        let { minNum, maxNum } = this.state;
        this.setState({
            magModalVisible: true,
            magSliderValue: [minNum, maxNum]
        });
    }
    //点击自定义震级模态框取消调用
    handleMagCancle = () => {
        this.setState({ magModalVisible: false });
    }
    //点击自定义震级模态框确定调用
    handleMagOk = () => {
        let { magSliderValue } = this.state;
        this.setState({
            minNum: magSliderValue[0],
            maxNum: magSliderValue[1],
            magnitudeSelected: null,
            magModalVisible: false,
        }, () => this.submitSearch());
    }
    //修改自定义震级滑块调用
    handleSliderChange = value => {
        this.setState({ magSliderValue: value });
    }
    //弹出自定义时间范围模态框调用
    showTimeModal = () => {
        this.setState({ timeModalVisible: true });
    }
    //点击自定义时间范围模态框取消调用
    handleTimeCancle = () => {
        this.setState({ timeModalVisible: false });
    }
    //点击自定义时间范围模态框确定调用
    handleTimeOk = () => {
        let { datePickerValue } = this.state;
        this.setState({
            startTime: datePickerValue[0]._d.getTime(),
            endTime: datePickerValue[1]._d.getTime(),
            timeSelected: null,
            timeModalVisible: false
        }, () => this.submitSearch());
    }
    //修改自定义时间范围调用
    handleTimeChange = value => {
        this.setState({ datePickerValue: value });
    }
    //弹出自定义震源深度模态框调用
    showDepModal = () => {
        let { startDepth, endDepth } = this.state;
        this.setState({
            depthModalVisible: true,
            depSliderValue: [startDepth, endDepth]
        });
    }
    //点击自定义震源深度模态框取消调用
    handleDepCancle = () => {
        this.setState({ depthModalVisible: false });
    }
    //点击自定义震源深度模态框确定调用
    handleDepOk = () => {
        let { depSliderValue } = this.state;
        this.setState({
            startDepth: depSliderValue[0],
            endDepth: depSliderValue[1],
            depthSelected: null,
            depthModalVisible: false,
        }, () => this.submitSearch());
    }
    //修改自定义震源深度滑块调用
    handleDepSliderChange = value => {
        this.setState({ depSliderValue: value });
    }
    //修改页面及每页条数调用
    pageHandler = (pageNum, pageSize) => {
        this.setState({
            startPage: pageNum,
            pageSize
        }, () => this.submitSearch(pageNum));
    }
    //时间排序
    timeSorter = () => {
        let { timeSort } = this.state;
        this.setState({
            timeSort: timeSort === null ? true : !timeSort
        }, () => this.submitSearch());
    }
    //下载搜索结果
    downloadSearchResult = () => {
        let { hits, keyword } = this.state;
        let title = "eqid,epicenter,datetime,magnitude,latitude,longitude,depth,createby,url,eqim\n";
        //添加"\uFEFF"以解决EXCEL打开csv文件中文乱码问题
        let result = "\uFEFF" + title + hits.map(({ eqid, address, datetime, magnitude, depth, createby, url, eqim }) =>
            `${"\"" + eqid + "\""},${"\"" + address.epicenter + "\""},${"\"" + datetime + "\""},${"\"" + magnitude + "\""},${"\"" + address.latitude + "\""},${"\"" + address.longitude + "\""},${"\"" + depth + "\""},${"\"" + createby + "\""},${"\"" + url + "\""},${"\"" + eqim + "\""}`
        ).join("\n");
        let blob = new Blob([result], { type: '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.download = keyword + '_search_result.csv';
        link.href = window.URL.createObjectURL(blob);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
    }
    //控制最小匹配度
    handleChangeMatch = value => {
        let { countrysSelected, countrysSelectedDrawer, keyword } = this.state;
        countrysSelected.map(tag => keyword += tag);
        countrysSelectedDrawer.map(tag => keyword += tag);
        this.setState({ minMatch: value }, () => { if (keyword) this.submitSearch() });
    }
    //跳转到知网文章
    linkToArticle = uuid => {
        axios.get(getArticle + uuid
        ).then(response => {
            let { thesis } = response.data;
            let { doi, webAddress, fileName, tableName2 } = thesis;
            if (webAddress && webAddress !== "无") {
                window.open(webAddress);
            } else if (doi) {
                if (!fileName) {
                    let a = doi.split(":");
                    let b = a[a.length - 1].split(".");
                    fileName = b[0] + b[b.length - 1].split("-").join("");
                }
                let url = `${articleUrl}?dbcode=CJFD&dbname=${tableName2}&filename=${fileName}`;
                window.open(url);
            } else {
                alert("很抱歉，未找到该文章对应链接，无法跳转。")
            }
        }).catch(err => { });
    }
    //全屏显示
    fullScreen = () => {
        let el = document.documentElement;
        let rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;
        rfs.call(el);
        this.setState({
            fullScreen: true
        });
    }
    exitFullScreen = () => {
        let el = document;
        let cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen;
        cfs.call(el);
        this.setState({
            fullScreen: false
        });
    }
    render() {
        let { status, loading, keyword, resultKey, hits, options, countrysSelected, countrysSelectedDrawer, magnitudeSelected, timeSelected, countryDrawerVisible,
            magModalVisible, timeModalVisible, depthModalVisible, magSliderValue, startPage, total, pageSize, viewType, menuDrawerVisible,
            collapsed, depthSelected, depSliderValue, timeSort, minMatch, articleList, relatedKeywords, articleLoading, fullScreen, fullScreenVisible
        } = this.state;
        let hitItems = null;
        switch (hits && viewType) {
            case null:
                hitItems = null;
                break;
            case "list":
                hitItems = <div className="list">
                    {hits.map(({ url, address, magnitude, datetime, depth, score }, key) =>
                        <div className="list-item item" key={key}>
                            <div style={{ maxWidth: "50%" }}>
                                <a className="item-name" href={url} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: address.epicenter ? address.epicenter : "未命名" }} />
                                <p className="item-magnitude">震级：{magnitude} 级</p>
                                <p className="item-time">时间：{datetime}</p>
                                <p className="item-desc">来源：中国地震台网正式测定</p>
                                <p className="item-desc">震中经度：{address.longitude}°</p>
                                <p className="item-desc">震中纬度：{address.latitude}°</p>
                                <p className="item-desc">震源深度：{depth} km</p>
                                {score ? <p className="item-desc">匹配度：{(score * 100).toFixed(2)}% </p> : null}
                            </div>
                            <div style={{ width: 360, maxWidth: "50%" }}>
                                <Map amapkey="3dabe81a1752997b9089ccb0b1bfcecb" zoom={7} center={[address.longitude, address.latitude]} events={this.mapEvents} plugins={['Scale']}>
                                    <Marker position={{ longitude: address.longitude, latitude: address.latitude }} offset={{ x: -8, y: -21 }}>
                                        <div className="marker">
                                            <div className="circle" />
                                            <div className="tran" />
                                        </div>
                                    </Marker>
                                </Map>
                            </div>
                        </div>
                    )}
                </div>;
                break;
            case "grid":
                hitItems = <div className="grid">
                    {hits.map(({ url, address, magnitude, datetime, depth, score }, key) =>
                        <div className="grid-item item" key={key}>
                            <div style={{ width: "100%", height: "160px" }}>
                                <Map amapkey="3dabe81a1752997b9089ccb0b1bfcecb" zoom={7} center={[address.longitude, address.latitude]} events={this.mapEvents} plugins={['Scale']}>
                                    <Marker position={{ longitude: address.longitude, latitude: address.latitude }} offset={{ x: -8, y: -21 }}>
                                        <div className="marker">
                                            <div className="circle" />
                                            <div className="tran" />
                                        </div>
                                    </Marker>
                                </Map>
                            </div>
                            <a className="item-name" href={url} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: address.epicenter ? address.epicenter : "未命名" }} />
                            <p className="item-magnitude">震级：{magnitude} 级</p>
                            <p className="item-time">时间：{datetime}</p>
                            <p className="item-desc">来源：中国地震台网正式测定</p>
                            <p className="item-desc">震中经度：{address.longitude}°</p>
                            <p className="item-desc">震中纬度：{address.latitude}°</p>
                            <p className="item-desc">震源深度：{depth} km</p>
                            {score ? <p className="item-desc">匹配度：{(score * 100).toFixed(2)}% </p> : null}
                        </div>
                    )}
                </div>;
                break;
            case "table":
                const dataSource = hits.map(({ address, magnitude, datetime, depth, url, score }, index) => {
                    return {
                        key: index,
                        epicenter: address.epicenter ? address.epicenter : "未命名",
                        magnitude,
                        datetime,
                        source: "中国地震台网正式测定",
                        longitude: address.longitude,
                        latitude: address.latitude,
                        depth,
                        url,
                        score
                    }
                });
                const columns = [{
                    title: "地震名称",
                    dataIndex: "epicenter",
                    render: (text, record) => <div style={{ paddingLeft: "16px", textDecoration: "underline" }}>
                        <a className="table-item-name" href={record.url} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: text ? text : "未命名" }} />
                    </div>
                }, {
                    title: "震级",
                    dataIndex: "magnitude",
                    align: "center",
                    sorter: (a, b) => a.magnitude - b.magnitude
                }, {
                    title: "时间",
                    dataIndex: "datetime",
                    align: "center"
                }, {
                    title: "来源",
                    dataIndex: "source",
                    align: "center"
                }, {
                    title: "震中经度(°)",
                    dataIndex: "longitude",
                    align: "center"
                }, {
                    title: "震中纬度(°)",
                    dataIndex: "latitude",
                    align: "center"
                }, {
                    title: "震源深度(km)",
                    dataIndex: "depth",
                    align: "center",
                    sorter: (a, b) => a.depth - b.depth
                }];
                if (hits[0].score) {
                    columns.push({
                        title: "匹配度",
                        dataIndex: "score",
                        align: "center",
                        render: score => (score * 100).toFixed(2) + "%"
                    });
                }
                hitItems = <div className="table">
                    <ConfigProvider ConfigProvider locale={zhCN}>
                        <Table dataSource={dataSource} columns={columns} loading={loading} sticky={true}
                            pagination={{
                                onChange: this.pageHandler,
                                showQuickJumper: true,
                                showLessItems: true,
                                pageSizeOptions: [12, 24, 48, 96],
                                showTitle: false,
                                current: startPage,
                                total: total,
                                pageSize: pageSize,
                            }}
                        />
                    </ConfigProvider>
                </div>;
                break;
            default:
                hitItems = null;
                break;
        }
        const filters = <>
            <div className="filter">
                <div className="filter-title">
                    <span>最小匹配度</span>
                </div>
                <div className="filter-content">
                    <InputNumber min={0} max={100} step={5} onChange={this.handleChangeMatch} value={minMatch} formatter={value => `${value}%`} parser={value => value.replace('%', '')} />
                </div>
            </div>
            <div className="filter">
                <div className="filter-title">国家</div>
                <div className="filter-content">
                    <Checkbox.Group options={countryFilter} value={countrysSelected} onChange={this.filtersHandler.bind(this, "countrysSelected")} />
                    <div>
                        <span onClick={this.showCountryDrawer} className="span-link">查看更多</span>
                        <Drawer title="国家" visible={countryDrawerVisible} onClose={this.handleCountryClose} width={collapsed ? "100%" : "50%"}>
                            <Checkbox.Group onChange={this.handleCountrySelectedDrawer} value={countrysSelectedDrawer}>
                                <Row gutter={5}>
                                    {globalCountrys.map((country, index) =>
                                        <Col span={6} key={index}>
                                            <Checkbox value={country.cn}>{country.cn}</Checkbox>
                                        </Col>
                                    )}
                                </Row>
                            </Checkbox.Group>
                        </Drawer>
                    </div>
                </div>
            </div>
            <div className="filter">
                <div className="filter-title">
                    <span>震级</span>
                    <span className="clear-option" onClick={this.clearOption.bind(this, "magnitude")}>取消筛选</span>
                </div>
                <div className="filter-content">
                    <Radio.Group options={magnitudeFilter} value={magnitudeSelected} onChange={this.magnitudeHandler} />
                    <div>
                        <span onClick={this.showMagModal} className="span-link">自定义</span>
                        <Modal title="震级范围" visible={magModalVisible} onCancel={this.handleMagCancle} onOk={this.handleMagOk} okText="确定" cancelText="取消">
                            <Slider range min={2} max={9} step={0.1} onChange={this.handleSliderChange} value={[magSliderValue[0] ? magSliderValue[0] : 2, magSliderValue[1] ? magSliderValue[1] : 9]} />
                        </Modal>
                    </div>
                </div>
            </div>
            <div className="filter">
                <div className="filter-title">
                    <span>地震活动时间</span>
                    <span className="clear-option" onClick={this.clearOption.bind(this, "time")}>取消筛选</span>
                </div>
                <div className="filter-content">
                    <Radio.Group options={timeFilter} value={timeSelected} onChange={this.timeHandler} />
                    <div>
                        <span onClick={this.showTimeModal} className="span-link">自定义</span>
                        <Modal title="地震时间" visible={timeModalVisible} onCancel={this.handleTimeCancle} onOk={this.handleTimeOk} okText="确定" cancelText="取消">
                            <RangePicker locale={locale} onChange={this.handleTimeChange} disabledDate={disabledDate}
                                showTime={{ hideDisabledOptions: true, defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('11:59:59', 'HH:mm:ss')] }}
                            />
                        </Modal>
                    </div>
                </div>
            </div>
            <div className="filter">
                <div className="filter-title">
                    <span>震源深度</span>
                    <span className="clear-option" onClick={this.clearOption.bind(this, "depth")}>取消筛选</span>
                </div>
                <div className="filter-content">
                    <Radio.Group options={depthFilter} value={depthSelected} onChange={this.depthHandler} />
                    <div>
                        <span onClick={this.showDepModal} className="span-link">自定义</span>
                        <Modal title="震源深度" visible={depthModalVisible} onCancel={this.handleDepCancle} onOk={this.handleDepOk} okText="确定" cancelText="取消">
                            <Slider range min={-1} max={690} step={1} onChange={this.handleDepSliderChange} value={[depSliderValue[0] ? depSliderValue[0] : -1, depSliderValue[1] ? depSliderValue[1] : 690]} />
                        </Modal>
                    </div>
                </div>
            </div>
            {collapsed ?
                <>
                    <div className="btn-link">
                        <Button type="primary"><a href={visUrl} target="_blank" rel="noopener noreferrer">可视化</a></Button>
                        <Button type="primary"><a href={kibanaUrl} target="_blank" rel="noopener noreferrer">Kibana</a></Button>
                    </div>
                    <div className="download">
                        下载当前页的搜索结果<Button type="primary" onClick={this.downloadSearchResult}>下载</Button>
                    </div>
                </>
                : null
            }
        </>;
        return (
            <div id="es">
                <div className="es-header">
                    <div className="header-content">
                        <div className="menu">
                            <div className="menu-btn" onClick={this.handleMenuClose}>
                                <svg viewBox="64 64 896 896" xmlns="http://www.w3.org/2000/svg">
                                    <path d={menuD} />
                                </svg>
                            </div>
                            <Drawer className="menu-drawer" visible={menuDrawerVisible} onClose={this.handleMenuClose}>
                                {filters}
                            </Drawer>
                        </div>
                        <div className="logo">
                            <svg viewBox="0 0 144 16" xmlns="http://www.w3.org/2000/svg">
                                <path d={d} />
                            </svg>
                        </div>
                        <div className="search-box">
                            <AutoComplete options={options} onSelect={value => { this.setState({ keyword: value }, () => { this.submitSearch(1, value); this.getSearchHintList(); }) }} defaultValue={keyword}>
                                <Search placeholder="请输入关键词进行搜索" onSearch={this.searchHandler} onChange={this.handleKeywordChange} />
                            </AutoComplete>
                        </div>
                    </div>
                </div>
                <div className="es-content">
                    {collapsed ?
                        null
                        :
                        <div className="es-sider">
                            {filters}
                        </div>
                    }
                    <div style={{ display: "flex", minWidth: 0, width: "100%" }}>
                        <div className="es-main">
                            <div className="sort-view">
                                <div className="total">共找到{total}条结果</div>
                                <div className="options">
                                    <div className={viewType === "grid" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "grid" })} style={{ borderRightColor: viewType === "table" ? "#ccc" : "#08c" }} >网格</div>
                                    <div className={viewType === "list" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "list" })}>列表</div>
                                    <div className={viewType === "table" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "table" })} style={{ borderLeftColor: viewType === "grid" ? "#ccc" : "#08c" }}>表格</div>
                                </div>
                            </div>
                            <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                                <div className="filters">
                                    {countrysSelected.length > 0 || countrysSelectedDrawer.length > 0 ?
                                        <>
                                            {countrysSelected.map((tag, index) => <Tag key={index} color="blue">{tag}</Tag>)}
                                            {countrysSelectedDrawer.map((tag, index) => <Tag key={index} color="blue">{tag}</Tag>)}
                                            <span className="filters-clear" onClick={this.clearFilters}>清空所有筛选项</span>
                                        </>
                                        : null}
                                </div>
                                <div className="time-block">
                                    时间排序：<Button className="time-sorter" onClick={this.timeSorter}>
                                        {timeSort === null ? "未排序" : timeSort ? "降序" : "升序"}
                                        {timeSort === null ? null :
                                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M704 704 704 0 576 0 576 1024 896 704Z" fill={timeSort ? "#08c" : ""} />
                                                <path d="M320 320 320 1024 448 1024 448 0 128 320Z" fill={timeSort ? "" : "#08c"} />
                                            </svg>
                                        }
                                    </Button>
                                </div>
                            </div>
                            <div className="hits-item">
                                {loading ?
                                    (viewType === "list" ? skeletonList :
                                        viewType === "grid" ? skeletonGrid :
                                            <div className="skeleton-table">
                                                <div className="skeleton-table-head">
                                                    <Skeleton.Input active size="small" />
                                                </div>
                                                {skeletonTable}
                                            </div>
                                    )
                                    : null}
                                {hitItems}
                                {hits && viewType !== "table" ?
                                    < ConfigProvider locale={zhCN}>
                                        <Pagination showQuickJumper showLessItems onChange={this.pageHandler} pageSizeOptions={[12, 24, 48, 96]} showTitle={false} current={startPage} total={total} pageSize={pageSize} />
                                    </ConfigProvider>
                                    : null}
                                {status ?
                                    hits || loading ? null :
                                        <Empty description={`没有搜索到 ${resultKey ? '"' + resultKey + '"' : ""} ${magnitudeSelected ? '"震级' + magnitudeSelected + '"' : ""} ${timeSelected ? '"' + timeSelected + '"' : ""} 的结果`} />
                                    : <Result status="error" title="数据库链接失败" subTitle="请检查网络链接或联系管理员" />}
                            </div>
                        </div>
                        <div className="related">
                            <div className="articles">
                                <p className="title">相关文章</p>
                                {articleLoading ?
                                    <>数据加载中<LoadingOutlined /></>
                                    :
                                    <ul>
                                        {articleList.length > 0 ?
                                            articleList.map((item, index) =>
                                                <li key={index} onClick={this.linkToArticle.bind(this, item.uuid)} title={item.name}>{item.name}</li>
                                            )
                                            : "没有搜索到相关的文章"}
                                    </ul>
                                }
                            </div>
                            <div className="keywords">
                                <p className="title">相关主题词</p>
                                {articleLoading ?
                                    <>数据加载中<LoadingOutlined /></>
                                    :
                                    relatedKeywords.length > 0 ?
                                        relatedKeywords.map((item, index) =>
                                            <Tag key={index} color="geekblue" title={item}>
                                                <a href={bingUrl + item} target="_blank" rel="noopener noreferrer">{item}</a>
                                            </Tag>)
                                        : "没有搜索到相关的主题词"
                                }
                            </div>
                            <div>
                                <p className="title">其他</p>
                                <div className="btn-link">
                                    <Button type="primary"><a href={visUrl} target="_blank" rel="noopener noreferrer">可视化</a></Button>
                                    <Button type="primary"><a href={kibanaUrl} target="_blank" rel="noopener noreferrer">Kibana</a></Button>
                                </div>
                                <div className="download">
                                    <div>
                                        <p>下载当前页的</p>
                                        <p>搜索结果</p>
                                    </div>
                                    <Button type="primary" onClick={this.downloadSearchResult}>下载</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
                <div className="es-footer">
                    <p>元计算（天津）科技发展有限公司</p>
                    <p>Copyright &copy;2020 All rights reserved</p>
                    <p>官方网站: <a href="http://www.yuanjisuan.cn" target="_blank" rel="noopener noreferrer">http://www.yuanjisuan.cn</a></p>
                </div>
                {fullScreenVisible ?
                    <div className="full-screen">
                        {fullScreen ? <FullscreenExitOutlined onClick={this.exitFullScreen} style={{ fill: "#fff" }} />
                            : <FullscreenOutlined onClick={this.fullScreen} style={{ fill: "#fff" }} />
                        }
                    </div>
                    : null
                }
            </div >
        )
    }
}

export default class index extends Component {
    render() {
        return (
            <Router>
                <Route path={["/", "/s"]} component={elasticdemo}></Route>
            </Router>
        )
    }
}