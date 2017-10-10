import React, {Component} from 'react';
import styled from 'styled-components'
import SettingsForm from './SettingsForm/SettingsForm'

export default class Settings extends Component {
    constructor() {
        super();
    }

    onSettingsChange = () => {

    }

    onSettingsSubmit = (values) => {
        console.log(values)
    }

    render() {
        const {settings} = this.props;
        return (
            <Container>
                <PageTitle>Settings Page</PageTitle>
                <SettingsForm initialValues={settings} onSubmit={this.onSettingsSubmit}/>
            </Container>
        )
    }
}
const PageTitle = styled.h4`
    padding: 5px 0px;
    margin: 0px;
    background-color: #D7D7D7;
    text-align: center;
`
const Container = styled.div`
    width: 100%;
    height: 100%;
`