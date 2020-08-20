import React, { Component } from 'react';
import { TimePicker } from "antd";

const CategoryFilter = () => <div className="filter">
    <div className="filter-title">类型</div>
    <div className="filter-content">
        <div><input type="checkbox" />震级</div>
        <div><input type="checkbox" />震中</div>
        <div><input type="checkbox" />时间</div>
    </div>
</div>;

const CountryFilter = () => <div className="filter">
    <div className="filter-title">国家</div>
    <div className="filter-content">
        <div><input type="checkbox" />中国</div>
        <div><input type="checkbox" />美国</div>
        <div><input type="checkbox" />日本</div>
        <div><input type="checkbox" />印度尼西亚</div>
        <div><input type="checkbox" />智利</div>
        <div><input type="checkbox" />新西兰</div>
        <div style={{ textAlign: "center" }}><a href="test">查看更多</a></div>
    </div>
</div>;

const SeismicBeltFilter = () => <div className="filter">
    <div className="filter-title">地震带</div>
    <div className="filter-content">
        <div><input type="checkbox" />环太平洋地震带</div>
        <div><input type="checkbox" />欧亚地震带</div>
        <div><input type="checkbox" />洋脊地震带</div>
    </div>
</div>;

const QuakeMagnitudeFilter = () => <div className="filter">
    <div className="filter-title">震级</div>
    <div className="filter-content">
        <div><input type="checkbox" />{"<"}=3</div>
        <div><input type="checkbox" />{">"}=3</div>
        <div><input type="checkbox" />{">"}=4</div>
        <div><input type="checkbox" />{">"}=5</div>
        <div><input type="checkbox" />{">"}=6</div>
        <div><input type="checkbox" />{">"}=7</div>
        <div style={{ textAlign: "center" }}><a href="test">自定义</a></div>
    </div>
</div>;

const QuakeTimeFilter = () => <div className="filter">
    <div className="filter-title">地震活动</div>
    <div className="filter-content">
        <div><input type="checkbox" />最近24小时</div>
        <div><input type="checkbox" />最近一周</div>
        <div><input type="checkbox" />最近一个月</div>
        <div style={{ textAlign: "center" }}><a href="test">自定义</a></div>
        <div>从 <TimePicker placeholder="请选择时间"></TimePicker></div>
        <div style={{ marginTop: 5 }}>至 <TimePicker placeholder="请选择时间"></TimePicker></div>
    </div>
</div>;

export default class Filters extends Component {
    render() {
        return (
            <div className="es-sider">
                <CategoryFilter />
                <CountryFilter />
                <SeismicBeltFilter />
                <QuakeMagnitudeFilter />
                <QuakeTimeFilter />
            </div>
        )
    }
}