import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {initChannels, changeStatus, deleteChannel, addChannel} from '../../../redux/actions/channels'
import {Link} from 'react-router-dom';
import styled from 'styled-components';

const {ipcRenderer} = window.require('electron');

class EventListener extends Component {

	constructor() {
		super()
	}
	
	componentWillMount() {
		this.props.initChannels()
		ipcRenderer.on('channel_wentOnline', (event, channel) => this.props.changeStatus(channel));
		ipcRenderer.on('channel_wentOffline', (event, channel) => this.props.changeStatus(channel));
		ipcRenderer.on('channel_add', (event, response) => {
			if (response.status) {
				const {channel} = response;
				this.props.addChannel(channel)
			}
		})
		ipcRenderer.on('channel_remove', (event, response) => {
			console.log(response)
			if (response.status) {
				this.props.deleteChannel(response.link)
			}
		});
	}

	render() {
		return (
			<EventContainer/>
		);
	}
}

const EventContainer = styled.div`
	display:none
`

export default connect(
	(state) => ({}),
	(dispatch) => bindActionCreators({
		initChannels,
		changeStatus,
		deleteChannel,
		addChannel
	}, dispatch)
)(EventListener);
