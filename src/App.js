import React, { Component } from 'react';
import axios from "axios";
import 'moment/locale/zh-cn';
import zhCN from 'antd/es/locale/zh_CN';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { ConfigProvider, message, DatePicker, Tag, Select, Input, Checkbox, Radio, Empty, Pagination, Modal, Slider, Result, Skeleton, Row, Col, Drawer } from "antd";
import "./index.less";
import globalCountrys from "./countrys"

const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

export default class elasticdemo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: true,
            loading: false,
            keyword: "",
            hits: null,
            typesSelected: [],
            countrysSelected: [],
            seismicBeltsSelected: [],
            magnitudeSelected: null,
            timeSelected: null,
            countryDrawerVisible: false,
            magModalVisible: false,
            timeModalVisible: false,
            startPage: 1,
            pageSize: 10,
            total: 0,
            minNum: null,
            maxNum: null,
            sliderValue: [2, 9],
            startTime: undefined,
            endTime: undefined,
            datePickerValue: [undefined, undefined],
            listView: true
        };
    }
    componentDidMount() {
        this.submitSearch();
    }
    submitSearch = pageNum => {
        let { keyword, minNum, maxNum, startTime, endTime, pageSize, typesSelected, countrysSelected, seismicBeltsSelected } = this.state;
        let _this = this;
        this.setState({
            loading: true,
            hits: null,
            startPage: pageNum ? pageNum : 1
        });
        typesSelected.map(tag => keyword = keyword + tag);
        countrysSelected.map(tag => keyword = keyword + tag);
        seismicBeltsSelected.map(tag => keyword = keyword + tag);
        axios.get('http://192.168.2.145:8900/es/getHighLightPage', {
            params: {
                indexName: "earthquake-indexs",
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
                status: false
            });
            message.error("检索库链接失败", 2)
        });
    }
    searchHandler = value => {
        this.setState({
            keyword: value,
        }, () => {
            this.submitSearch();
        });
    }
    magnitudeHandler = e => {
        let { minNum, maxNum } = this.state;
        switch (e.target.value) {
            case "lt3":
                minNum = null;
                maxNum = 3;
                break;
            case "gt3":
                minNum = 3;
                maxNum = null;
                break;
            case "gt4":
                minNum = 4;
                maxNum = null;
                break;
            case "gt5":
                minNum = 5;
                maxNum = null;
                break;
            case "gt6":
                minNum = 6;
                maxNum = null;
                break;
            case "gt7":
                minNum = 7;
                maxNum = null;
                break;
            default:
                minNum = null;
                maxNum = null;
        };
        this.setState({
            minNum,
            maxNum,
            magnitudeSelected: e.target.value,
            sliderValue: [minNum, maxNum],
        }, () => {
            this.submitSearch();
        });
    }
    filtersHandler = (key, value) => {
        this.setState({
            [key]: value,
        }, () => {
            this.submitSearch();
        });
    }
    timeHandler = e => {
        let { startTime, endTime } = this.state;
        let currentTimeStamp = new Date().getTime();
        switch (e.target.value) {
            case 1:
                startTime = currentTimeStamp - 24 * 60 * 60 * 1000;
                endTime = currentTimeStamp;
                break;
            case 2:
                startTime = currentTimeStamp - 7 * 24 * 60 * 60 * 1000;
                endTime = currentTimeStamp;
                break;
            case 3:
                startTime = currentTimeStamp - 30 * 7 * 24 * 60 * 60 * 1000;
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
        }, () => {
            this.submitSearch();
        });
    }
    clearFilters = () => {
        this.setState({
            typesSelected: [],
            countrysSelected: [],
            seismicBeltsSelected: [],
        }, () => {
            this.submitSearch();
        });
    }
    clearOption = name => {
        if (name === "magnitude") {
            this.setState({
                minNum: null,
                maxNum: null,
                magnitudeSelected: null,
            }, () => {
                this.submitSearch();
            });
        } else if (name === "time") {
            this.setState({
                timeSelected: null,
            }, () => {
                this.submitSearch();
            });
        }
    }
    showCountryModal = () => {
        this.setState({
            countryDrawerVisible: true,
        });
    }
    handleCountrySelected = value => {
        this.setState(
            { countrysSelected: value },
            () => {
                this.submitSearch();
            })
    }
    handleCountryClose = () => {
        this.setState({ countryDrawerVisible: false });
    }
    showMagModal = () => {
        let { minNum, maxNum } = this.state;
        this.setState({
            magModalVisible: true,
            sliderValue: [minNum, maxNum]
        });
    }
    handleMagCancle = () => {
        this.setState({ magModalVisible: false });
    }
    handleMagOk = () => {
        let { sliderValue } = this.state;
        this.setState({
            minNum: sliderValue[0],
            maxNum: sliderValue[1],
            magnitudeSelected: null,
            magModalVisible: false,
        }, () => {
            this.submitSearch();
        });
    }
    handleSliderChange = value => {
        this.setState({
            sliderValue: value
        });
    }
    showTimeModal = () => {
        this.setState({
            timeModalVisible: true,
        });
    }
    handleTimeCancle = () => {
        this.setState({ timeModalVisible: false });
    }
    handleTimeOk = () => {
        let { datePickerValue } = this.state;
        this.setState({
            startTime: datePickerValue[0]._d.getTime(),
            endTime: datePickerValue[1]._d.getTime(),
            timeSelected: null,
            timeModalVisible: false
        }, () => {
            this.submitSearch();
        });
    }
    handleTimeChange = value => {
        this.setState({
            datePickerValue: value
        });
    }
    pageHandler = (pageNum, pageSize) => {
        this.setState({
            startPage: pageNum,
            pageSize
        }, () => {
            this.submitSearch(pageNum);
        });
    }
    render() {
        let { status, loading, keyword, hits,
            typesSelected, countrysSelected, seismicBeltsSelected,
            magnitudeSelected, timeSelected, countryDrawerVisible, magModalVisible,
            timeModalVisible, sliderValue, startPage, total, pageSize, listView }
            = this.state;
        const magnitudeOptions = [
            { label: '<=3', value: "lt3" },
            { label: '>=3', value: "gt3" },
            { label: '>=4', value: "gt4" },
            { label: '>=5', value: "gt5" },
            { label: '>=6', value: "gt6" },
            { label: '>=7', value: "gt7" },
        ];
        const typeFilter = ["震级", "震中", "时间"];
        const countryFilter = ["中国", "美国", "日本", "印度尼西亚", "智利", "新西兰"];
        const seismicBeltFilter = ["环太平洋地震带", "欧亚地震带", "洋脊地震带"];
        const timeFilter = [
            { label: '最近24小时', value: 1 },
            { label: '最近一周', value: 2 },
            { label: '最近一个月', value: 3 }
        ];
        let skeletonArray = [];
        for (let i = 0; i < pageSize; i++) {
            skeletonArray.push(i);
        }
        return (
            <div id="es">
                <div className="es-header">
                    <div className="header-content">
                        <div className="logo">世界地震信息库</div>
                        <div className="search-box">
                            <Search
                                placeholder="请输入关键词进行搜索"
                                onSearch={this.searchHandler}
                                defaultValue={keyword}
                            />
                        </div>
                    </div>
                </div>
                <div className="es-content">
                    <div className="es-sider">
                        <div className="filter">
                            <div className="filter-title">类型</div>
                            <div className="filter-content">
                                <Checkbox.Group options={typeFilter} value={typesSelected} onChange={this.filtersHandler.bind(this, "typesSelected")} />
                            </div>
                        </div>
                        <div className="filter">
                            <div className="filter-title">国家</div>
                            <div className="filter-content">
                                <Checkbox.Group options={countryFilter} value={countrysSelected} onChange={this.filtersHandler.bind(this, "countrysSelected")} />
                                <div>
                                    <span onClick={this.showCountryModal} className="span-link">查看更多</span>
                                    <Drawer
                                        title="国家"
                                        visible={countryDrawerVisible}
                                        onClose={this.handleCountryClose}
                                        width="50%"
                                    >
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
                            <div className="filter-title">地震带</div>
                            <div className="filter-content">
                                <Checkbox.Group options={seismicBeltFilter} value={seismicBeltsSelected} onChange={this.filtersHandler.bind(this, "seismicBeltsSelected")} />
                            </div>
                        </div>
                        <div className="filter">
                            <div className="filter-title">震级<span className="clear-option" onClick={this.clearOption.bind(this, "magnitude")}>清除选项</span></div>
                            <div className="filter-content">
                                <Radio.Group options={magnitudeOptions} value={magnitudeSelected} onChange={this.magnitudeHandler} />
                                <div>
                                    <span onClick={this.showMagModal} className="span-link">自定义</span>
                                    <Modal
                                        title="震级范围"
                                        visible={magModalVisible}
                                        onCancel={this.handleMagCancle}
                                        onOk={this.handleMagOk}
                                        okText="确定"
                                        cancelText="取消"
                                    >
                                        <Slider
                                            range
                                            tooltipVisible
                                            min={2}
                                            max={9}
                                            step={0.1}
                                            value={[sliderValue[0] ? sliderValue[0] : 2, sliderValue[1] ? sliderValue[1] : 9]}
                                            onChange={this.handleSliderChange}
                                        />
                                    </Modal>
                                </div>
                            </div>
                        </div>
                        <div className="filter">
                            <div className="filter-title">地震活动<span className="clear-option" onClick={this.clearOption.bind(this, "time")}>清除选项</span></div>
                            <div className="filter-content">
                                <Radio.Group options={timeFilter} value={timeSelected} onChange={this.timeHandler} />
                                <div>
                                    <span onClick={this.showTimeModal} className="span-link">自定义</span>
                                    <Modal
                                        title="地震时间"
                                        visible={timeModalVisible}
                                        onCancel={this.handleTimeCancle}
                                        onOk={this.handleTimeOk}
                                        okText="确定"
                                        cancelText="取消"
                                    >
                                        <RangePicker
                                            showTime
                                            locale={locale}
                                            onChange={this.handleTimeChange}
                                        />
                                    </Modal>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="es-main">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="total">共找到{total}条结果</div>
                            <div style={{ display: "flex" }}>
                                <div className="options">
                                    <div
                                        className="option1 option"
                                        onClick={() => { this.setState({ listView: false }) }}
                                        style={{
                                            backgroundColor: listView ? "#fff" : "#08c",
                                            color: listView ? "#000" : "#fff",
                                            borderColor: listView ? "#ccc" : "#08c"
                                        }}
                                    >
                                        网格
                                    </div>
                                    <div
                                        className="option2 option"
                                        onClick={() => { this.setState({ listView: true }) }}
                                        style={{
                                            backgroundColor: listView ? "#08c" : "#fff",
                                            color: listView ? "#fff" : "#000",
                                            borderColor: listView ? "#08c" : "#ccc",
                                            borderLeft: listView ? "" : "none",
                                        }}
                                    >
                                        列表
                                    </div>
                                </div>
                                <Select defaultValue="相关性排序" style={{ width: 140 }}>
                                    <Option value="由大到小">由大到小</Option>
                                    <Option value="由小到大">由小到大</Option>
                                </Select>
                            </div>
                        </div>
                        <div className="filters">
                            {typesSelected.length > 0 || countrysSelected.length > 0 || seismicBeltsSelected.length > 0 ?
                                <>
                                    {typesSelected.map((tag, index) => <Tag key={index} color="orange">{tag}</Tag>)}
                                    {countrysSelected.map((tag, index) => <Tag key={index} color="blue">{tag}</Tag>)}
                                    {seismicBeltsSelected.map((tag, index) => <Tag key={index} color="cyan">{tag}</Tag>)}
                                    <span className="filters-clear" onClick={this.clearFilters}>清空所有筛选项</span>
                                </>
                                : null
                            }
                        </div>
                        <div className="list">
                            {loading ?
                                skeletonArray.map(item => <Skeleton key={item} active />)
                                : null
                            }
                            {hits ?
                                <>
                                    {hits.map((item, key) =>
                                        <div className="list-item" key={key}>
                                            <div className="item-info">
                                                <div className="item-name">
                                                    <a
                                                        href={item.url}
                                                        dangerouslySetInnerHTML={{ __html: keyword || typesSelected.length > 0 || countrysSelected.length > 0 || seismicBeltsSelected.length > 0 ? item["address.epicenter"] : item.address.epicenter }}
                                                        target="_blank"
                                                        rel="noopener noreferrer">
                                                    </a>
                                                </div>
                                                <div className="item-level">震级：{item.magnitude}级</div>
                                                <div className="item-time">时间：{item.datetime}</div>
                                                <div className="item-desc">来源：中国地震台网正式测定</div>
                                                <div className="item-desc">震中经度：{item.address.longitude}</div>
                                                <div className="item-desc">震中纬度：{item.address.latitude}</div>
                                                <div className="item-desc">震源深度：{item.depth}</div>
                                            </div>
                                        </div>)
                                    }
                                    < ConfigProvider locale={zhCN}>
                                        <Pagination
                                            onChange={this.pageHandler}
                                            showQuickJumper
                                            current={startPage}
                                            total={total}
                                            pageSize={pageSize}
                                        />
                                    </ConfigProvider>
                                </>
                                : null
                            }
                            {status ?
                                (hits || loading ?
                                    null :
                                    <Empty description={`没有 "${keyword}" 的搜索结果`} />
                                )
                                :
                                <Result
                                    status="error"
                                    title="检索库链接失败"
                                    subTitle="请检查网络链接或联系管理员."
                                />
                            }
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}