import React, { Component } from 'react';
import { Tag } from "antd";

export default class FilterTags extends Component {
    state = {
        tags: ["中国", "震级", "欧亚地震带"]
    };
    render() {
        let { tags } = this.state;
        return (
            <div className="filters">
                {tags.map((tag, index) => <Tag closable key={index}>{tag}</Tag>)}
                <a href="test" style={{ color: "#08c", paddingLeft: "15px" }}>清空所有筛选项</a>
            </div>
        )
    }
}