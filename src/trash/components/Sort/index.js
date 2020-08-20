import React, { Component } from 'react';
import { Select } from "antd";
const { Option } = Select;

export default class index extends Component {
    render() {
        return (
            <Select defaultValue="相关性排序" style={{ width: 140 }}>
                <Option value="由大到小">由大到小</Option>
                <Option value="由小到大">由小到大</Option>
            </Select>
        )
    }
}