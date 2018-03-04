import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import Icon from 'react-icons-kit';
import {cog} from 'react-icons-kit/fa/cog';
import {Link} from 'react-router-dom';
import styled, {withTheme} from 'styled-components';
import {Form} from 'react-final-form'
import Update from 'src/Channel/Components/Update'
import SearchForm from 'src/Channel/Forms/SearchForm/SearchForm';
import Footer from 'src/Channel/Components/Footer'
import Tabs from 'src/Channel/Components/Tabs';
import Loading from 'src/Shared/Loading'
import Channels from 'src/Channel/Components/Channels'
import {
    getLoaded,
    getFilter,
    updateData
} from 'src/redux/channel'


@withTheme
@connect(
    state => ({
        loaded: getLoaded(state),
        filter: getFilter(state),
    }),
    {
        updateData,
    }
)
class ChannelContainer extends PureComponent {
    constructor() {
        super();

        this.state = {
            selected: null,
            editChannel: null,
        };
    }

    sendInfo = info => this.props.sendInfo(info);

    setFilter = value => {
        const filter = value.filter ? value.filter : '';
        console.log(value);
        this.props.updateData(filter, null)
    }


    render() {
        const {
            update,
            loaded,
            filter
        } = this.props;


        if (!loaded) {
            return (
                <Loading/>
            )
        }

        return (
            <Wrapper>
                <ChannelSearchForm
                    onSubmit={this.setFilter}
                    save={this.setFilter}
                    initialValues={{filter}}
                    render={props => <SearchForm {...props}/>}
                    subscription={{}}
                />

                <ContainerWrapper>
                    <TabWrapper>
                        <Tabs/>
                        <SettingsIcon to="/about">
                            <CogIcon icon={cog} size={18}/>
                        </SettingsIcon>
                    </TabWrapper>

                    <TabPanel>
                        <Channels/>
                    </TabPanel>
                    <Update/>
                    <Footer/>
                </ContainerWrapper>
            </Wrapper>
        );
    }
}

const ChannelSearchForm = styled(Form)`
`;

const CogIcon = styled(Icon)`
    color: ${props => props.theme.clientSecondary.color};
    padding-left: 1px;
`

const Wrapper = styled.div`
    width: 100%;
    margin-bottom: 48px;
`;

const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: block;
    max-height: 100vh;
    margin-right: 3px;
    background-color: ${props => props.theme.clientSecondary.bg};
    border: 1px solid ${props => props.theme.outline};
    border-left: none;
`;

const SettingsIcon = styled(Link)`
    display: flex;
    justify-content: center;
`;

const ContainerWrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    background-color: ${props => props.theme.client.bg};
`;


const TabWrapper = styled.div`
    height: 100%;
    background-color: ${props => props.theme.client.bg};
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    border-right: 1px solid ${props => props.theme.outline};
    position: relative;
    z-index: 2;
    align-items: center;
`;

export default ChannelContainer