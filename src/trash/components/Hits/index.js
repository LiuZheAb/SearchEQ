import React, { Component } from 'react';
import "./index.less";

let data = [
    {
        name: "喀什地区塔什库尔干县",
        level: "3.2",
        time: "-04-14 03:08:38",
        jing: "75.22",
        wei: "37.55",
        depth: "88km",
    }, {
        name: "伊犁州霍城县",
        level: "4.1",
        time: "-04-14 19:20:54",
        jing: "81.11",
        wei: "44.3",
        depth: "5km",
    }, {
        name: "克孜勒苏州乌恰县",
        level: "3",
        time: "-04-18 09:38:33",
        jing: "75.21",
        wei: "39.72",
        depth: "24km"
    }, {
        name: "乌鲁木齐市达坂城区",
        level: "2.4",
        time: "-04-28 10:35:02",
        jing: "87.96",
        wei: "43.66",
        depth: "20km"
    }, {
        name: "克孜勒苏州阿克陶县",
        level: "4.3",
        time: "-04-29 08:23:22",
        jing: "73.88",
        wei: "39.32",
        depth: "61km"
    }, {
        name: "喀什地区塔什库尔干县",
        level: "3.4",
        time: "-05-01 16:13:13",
        jing: "75.84",
        wei: "36.94",
        depth: "16km"
    }, {
        name: "克拉玛依市克拉玛依区",
        level: "3.2",
        time: "-05-03 20:02:46",
        jing: "84.74",
        wei: "45.5",
        depth: "18km"
    }, {
        name: "阿克苏地区库车县",
        level: "3",
        time: "-05-07 11:58:20",
        jing: "83.71",
        wei: "41.28",
        depth: "7km"
    }, {
        name: "博尔塔拉州温泉县",
        level: "4.2",
        time: "-05-10 03:15:57",
        jing: "80.7",
        wei: "45.1",
        depth: "13km"
    }, {
        name: "维吾尔自治区博尔塔拉蒙古自治州温泉县",
        level: "4",
        time: "-05-10 03:15:53",
        jing: "80.44",
        wei: "45.11",
        depth: "7km"
    }, {
        name: "吐鲁番市托克逊县",
        level: "3.3",
        time: "-05-10 12:19:22",
        jing: "87.96",
        wei: "42.96",
        depth: "18km"
    }, {
        name: "克孜勒苏州阿克陶县",
        level: "3.2",
        time: "-05-12 04:51:55",
        jing: "74.49",
        wei: "39.04",
        depth: "8km"
    }, {
        name: "巴音郭楞州轮台县",
        level: "3.4",
        time: "-05-13 10:13:23",
        jing: "84.16",
        wei: "42.06",
        depth: "15km"
    }, {
        name: "和田地区皮山县",
        level: "3.6",
        time: "-05-13 11:55:26",
        jing: "78.32",
        wei: "36.96",
        depth: "23km"
    }, {
        name: "阿勒泰地区布尔津县",
        level: "4",
        time: "-05-14 17:48:32",
        jing: "86.7",
        wei: "47.49",
        depth: "5km"
    }
];

export default class Hits extends Component {
    render() {
        return (
            <div className="list">
                {this.props.hits.map((item, key) =>
                    <div className="list-item" key={key}>
                        <div className="item-info">
                            <a href={item.url} target="_blank" rel="noopener noreferrer"><div className="item-name" dangerouslySetInnerHTML={{ __html: item["address.epicenter"] }}></div></a>
                            <div className="item-level">震级：{item.magnitude}级</div>
                            <div className="item-time">时间：{item.datetime}</div>
                            <div className="item-desc">来源：中国地震台网正式测定</div>
                            <div className="item-desc">震中经度：{item.address.longitude}</div>
                            <div className="item-desc">震中纬度：{item.address.latitude}</div>
                            <div className="item-desc">震源深度：{item.depth}</div>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}