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
import { ConfigProvider, DatePicker, Tag, Button, Input, Checkbox, Radio, Empty, Pagination, Modal, Slider, Result, Skeleton, Row, Col, Drawer, Table, AutoComplete } from "antd";
import { BrowserRouter as Router, Route } from "react-router-dom";
import globalCountrys from "./countrys";
import "./index.less";

const { Search } = Input, { RangePicker } = DatePicker;
// const api = "http://10.2.14.251:8900/es", indexName = "earthquake-indexs-v2";
const api = "http://192.168.2.134:8900/es", indexName = "earthquake-indexs";
const magnitudeOptions = ["<=3", ">=3", ">=4", ">=5", ">=6", ">=7"],
    countryFilter = ["中国", "美国", "日本", "印度尼西亚", "智利", "新西兰"],
    timeFilter = ['最近24小时', "最近一周", "最近一个月"],
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
function Logo() {
    return React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 144 16"
    }, React.createElement("path", { d })
    );
}
const menuD = "M 904 160 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z m 0 624 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z m 0 -312 H 120 c -4.4 0 -8 3.6 -8 8 v 64 c 0 4.4 3.6 8 8 8 h 784 c 4.4 0 8 -3.6 8 -8 v -64 c 0 -4.4 -3.6 -8 -8 -8 Z";
function MenuBtn() {
    return React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "64 64 896 896"
    }, React.createElement("path", { d: menuD })
    );
}
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
            magnitudeSelected: null,
            timeSelected: null,
            countryDrawerVisible: false,
            magModalVisible: false,
            timeModalVisible: false,
            startPage: 1,
            pageSize: 12,
            total: 0,
            minNum: null,
            maxNum: null,
            sliderValue: [2, 9],
            startTime: undefined,
            endTime: undefined,
            datePickerValue: [undefined, undefined],
            viewType: "list",
            menuDrawerVisible: false,
            collapsed: false
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
    }
    //比较窗口与768px大小
    handleClientW = width => {
        this.setState({
            collapsed: width <= 768
        })
    }
    handleResize = e => {
        this.handleClientW(e.target.innerWidth);
    }
    // 发起搜索请求，提交各项参数
    submitSearch = (pageNum, string) => {
        let { keyword, minNum, maxNum, startTime, endTime, pageSize, countrysSelected } = this.state;
        let _this = this;
        this.setState({
            loading: true,
            hits: null,
            startPage: pageNum ? pageNum : 1,
            resultKey: string ? string : keyword
        });
        countrysSelected.map(tag => keyword += tag);
        axios.get(api + "/getHighLightPage", {
            params: {
                indexName,
                startPage: pageNum ? pageNum : 1,
                pageSize,
                highFields: keyword,
                minNum,
                maxNum,
                startTime,
                endTime
            }
        }).then(function (response) {
            let { list, total } = response.data;
            _this.setState({
                status: true,
                loading: false,
                hits: list,
                total: total
            });
        }).catch(function (error) {
            _this.setState({
                loading: false,
                status: false
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
            axios.get(api + "/getTitleTip", {
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
            case "<=3":
                minNum = null;
                maxNum = 3;
                break;
            case ">=3":
                minNum = 3;
                maxNum = null;
                break;
            case ">=4":
                minNum = 4;
                maxNum = null;
                break;
            case ">=5":
                minNum = 5;
                maxNum = null;
                break;
            case ">=6":
                minNum = 6;
                maxNum = null;
                break;
            case ">=7":
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
            sliderValue: [minNum, maxNum],
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
    //清空类型、国家、地震带筛选项
    clearFilters = () => {
        this.setState({ countrysSelected: [] }, () => this.submitSearch());
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
            default:
                break;
        }
    }
    //弹出所有国家抽屉调用
    showCountryDrawer = () => {
        this.setState({ countryDrawerVisible: true });
    }
    //选择国家时调用
    handleCountrySelected = value => {
        this.setState({ countrysSelected: value }, () => this.submitSearch());
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
            sliderValue: [minNum, maxNum]
        });
    }
    //点击自定义震级模态框取消调用
    handleMagCancle = () => {
        this.setState({ magModalVisible: false });
    }
    //点击自定义震级模态框确定调用
    handleMagOk = () => {
        let { sliderValue } = this.state;
        this.setState({
            minNum: sliderValue[0],
            maxNum: sliderValue[1],
            magnitudeSelected: null,
            magModalVisible: false,
        }, () => this.submitSearch());
    }
    //修改自定义震级滑块调用
    handleSliderChange = value => {
        this.setState({ sliderValue: value });
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
    //修改页面及每页条数调用
    pageHandler = (pageNum, pageSize) => {
        this.setState({
            startPage: pageNum,
            pageSize
        }, () => this.submitSearch(pageNum));
    }
    render() {
        let { status, loading, keyword, resultKey, hits, options, countrysSelected, magnitudeSelected, timeSelected, countryDrawerVisible,
            magModalVisible, timeModalVisible, sliderValue, startPage, total, pageSize, viewType, menuDrawerVisible, collapsed
        } = this.state;
        let hitItems = null;
        switch (hits && viewType) {
            case null:
                hitItems = null;
                break;
            case "list":
                hitItems = <div className="list">
                    {hits.map(({ url, address, magnitude, datetime, depth }, key) =>
                        <div className="list-item item" key={key}>
                            <div style={{ maxWidth: "50%" }}>
                                <a className="item-name" href={url} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: address.epicenter ? address.epicenter : "未命名" }} />
                                <p className="item-magnitude">震级：{magnitude}级</p>
                                <p className="item-time">时间：{datetime}</p>
                                <p className="item-desc">来源：中国地震台网正式测定</p>
                                <p className="item-desc">震中经度：{address.longitude}</p>
                                <p className="item-desc">震中纬度：{address.latitude}</p>
                                <p className="item-desc">震源深度：{depth}</p>
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
                    {hits.map(({ url, address, magnitude, datetime, depth }, key) =>
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
                            <p className="item-magnitude">震级：{magnitude}级</p>
                            <p className="item-time">时间：{datetime}</p>
                            <p className="item-desc">来源：中国地震台网正式测定</p>
                            <p className="item-desc">震中经度：{address.longitude}</p>
                            <p className="item-desc">震中纬度：{address.latitude}</p>
                            <p className="item-desc">震源深度：{depth}</p>
                        </div>
                    )}
                </div>;
                break;
            case "table":
                const dataSource = hits.map(({ address, magnitude, datetime, depth, url }, index) => {
                    return {
                        key: index,
                        epicenter: address.epicenter ? address.epicenter : "未命名",
                        magnitude,
                        datetime,
                        source: "中国地震台网正式测定",
                        longitude: address.longitude,
                        latitude: address.latitude,
                        depth,
                        url
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
                    title: "震中经度",
                    dataIndex: "longitude",
                    align: "center"
                }, {
                    title: "震中纬度",
                    dataIndex: "latitude",
                    align: "center"
                }, {
                    title: "震源深度",
                    dataIndex: "depth",
                    align: "center",
                    sorter: (a, b) => a.depth - b.depth
                }];
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
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px" }}>
                <Button type="primary"><a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">可视化</a></Button>
                <Button type="primary"><a href="http://10.2.14.251:5601/app/kibana#/visualize/edit/c813d550-1b2e-11ea-90dd-a99c382af56d?embed=true&_g=()&_a=(filters:!(),linked:!f,query:(language:kuery,query:''),uiState:(mapCenter:!(33.760882000869195,96.24023437500001),mapZoom:4),vis:(aggs:!((enabled:!t,id:'1',params:(),schema:metric,type:count),(enabled:!t,id:'2',params:(autoPrecision:!t,field:location,isFilteredByCollar:!t,mapBounds:(bottom_right:(lat:15.496032414238634,lon:140.537109375),top_left:(lat:46.830133640447414,lon:66.53320312499999)),mapCenter:(lat:32.509761735919426,lon:103.53515625),mapZoom:4,precision:3,useGeocentroid:!t),schema:segment,type:geohash_grid)),params:(addTooltip:!f,colorSchema:'Green+to+Red',dimensions:(geocentroid:(accessor:3,aggType:geo_centroid,format:(id:string),params:()),geohash:(accessor:1,aggType:geohash_grid,format:(id:string),params:(precision:3,useGeocentroid:!t)),metric:(accessor:2,aggType:count,format:(id:number),params:())),heatClusterSize:1.8,isDesaturated:!f,legendPosition:bottomright,mapCenter:!(0,0),mapType:Heatmap,mapZoom:2,wms:(enabled:!t,options:(attribution:'Maps+provided+by+Geoserver+of+ISPEC',format:image%2Fpng,layers:'forkibana:worldmap',styles:redline,transparent:!t,version:'1.3.0'),selectedTmsLayer:(attribution:'',id:road_map,maxZoom:20,minZoom:0,origin:elastic_maps_service),url:'http:%2F%2F10.2.14.246:8080%2Fgeoserver%2Fforkibana%2Fwms%3F')),title:geoserver2,type:tile_map))" target="_blank" rel="noopener noreferrer">Kibana</a></Button>
            </div>
            <div className="filter">
                <div className="filter-title">国家</div>
                <div className="filter-content">
                    <Checkbox.Group options={countryFilter} value={countrysSelected} onChange={this.filtersHandler.bind(this, "countrysSelected")} />
                    <div>
                        <span onClick={this.showCountryDrawer} className="span-link">查看更多</span>
                        <Drawer title="国家" visible={countryDrawerVisible} onClose={this.handleCountryClose} width={collapsed ? "100%" : "50%"}>
                            <Checkbox.Group onChange={this.handleCountrySelected} value={countrysSelected}>
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
                    <Radio.Group options={magnitudeOptions} value={magnitudeSelected} onChange={this.magnitudeHandler} />
                    <div>
                        <span onClick={this.showMagModal} className="span-link">自定义</span>
                        <Modal title="震级范围" visible={magModalVisible} onCancel={this.handleMagCancle} onOk={this.handleMagOk} okText="确定" cancelText="取消">
                            <Slider range min={2} max={9} step={0.1} onChange={this.handleSliderChange} value={[sliderValue[0] ? sliderValue[0] : 2, sliderValue[1] ? sliderValue[1] : 9]} />
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
        </>;
        return (
            <div id="es">
                <div className="es-header">
                    <div className="header-content">
                        <div className="menu">
                            <div className="menu-btn" onClick={this.handleMenuClose}>
                                {MenuBtn()}
                            </div>
                            <Drawer className="menu-drawer" visible={menuDrawerVisible} onClose={this.handleMenuClose}>
                                {filters}
                            </Drawer>
                        </div>
                        <div className="logo">
                            {Logo()}
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
                    <div className="es-main">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="total">共找到{total}条结果</div>
                            <div className="options">
                                <div className={viewType === "grid" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "grid" })} style={{ borderRightColor: viewType === "table" ? "#ccc" : "#08c" }} >
                                    网格
                                </div>
                                <div className={viewType === "list" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "list" })}>
                                    列表
                                </div>
                                <div className={viewType === "table" ? "option-active option" : "option"} onClick={() => this.setState({ viewType: "table" })} style={{ borderLeftColor: viewType === "grid" ? "#ccc" : "#08c" }}>
                                    表格
                                </div>
                            </div>
                        </div>
                        <div className="filters">
                            {countrysSelected.length > 0 ?
                                <>
                                    {countrysSelected.map((tag, index) => <Tag key={index} color="blue">{tag}</Tag>)}
                                    <span className="filters-clear" onClick={this.clearFilters}>清空所有筛选项</span>
                                </>
                                : null}
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
                                : <Result status="error" title="检索库链接失败" subTitle="请检查网络链接或联系管理员." />}
                        </div>
                    </div>
                </div>
                <div className="es-footer">
                    <p>北京白家疃地球科学国家野外科学观测研究站</p>
                    <p>Copyright &copy;2020 All rights reserved.</p>
                    <p>官方网站: <a href="http://www.neobji.ac.cn/" target="_blank" rel="noopener noreferrer">http://www.neobji.ac.cn/</a></p>
                </div>
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