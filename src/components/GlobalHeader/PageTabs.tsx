import React, { useState, useEffect } from 'react';
import Link from 'umi/link';
import withRouter from 'umi/withRouter';
import { Tabs, Icon, Dropdown, Menu } from 'antd';
import { TabsProps } from 'antd/es/tabs';
import { getAuthorityFromRouter } from '@/utils/utils';
import {connect} from 'dva';
import {BrowserRouter as Router} from 'dva/router';

const { TabPane } = Tabs;
export type DataSourceItem = {
  title: string;
  key: string;
  path: string;
  component: React.ReactNode;
  closable: boolean;
};
export type DataSource = Array <DataSourceItem>;
type ActiveKey = TabsProps['activeKey'];
interface PageTabsProps {
  dataSource: DataSource,
  activeKey?: ActiveKey,
  routeData: {},
}


const renderExtraContent: React.ReactNode = (onClick: (e: { key: string }) => void) => {
  const menu = (
    <Menu onClick={onClick}>
      <Menu.Item key="1">
        关闭全部
      </Menu.Item>
      <Menu.Item key="2">
        关闭其它
      </Menu.Item>
    </Menu>
  );
  return (
    <Dropdown overlay={menu}>
      <Icon type="setting" />
    </Dropdown>
  );
};

const PageTabs: React.FC<PageTabsProps> = props => {
const {
  dataSource,
  activeKey,
  location,
  dispatch,
  routeData,
  itemRender,
} = props;
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const data = getAuthorityFromRouter(routeData.routes, location.pathname);
    console.log(data,location);
    dispatch({
      type: 'global/setPageTags',
      payload: {
        ...data,
        path: `${location.pathname}${location.search}`,
        key: `${location.pathname}${location.search}`,
      },
    });
  }, [location.pathname, location.search]);

  const handleChange = (key: string) => {
    dispatch({
      type: 'global/setActivePageTabKey',
      payload: key,
    });
  };
  const handleRefresh = (key: ActiveKey) => {
    setRefresh(true);
    dispatch({
      type: 'global/refreshPageTab',
      payload: key,
    });
    setTimeout(() => {
      setRefresh(false);
    }, 1000);
  };
  const handleEdit = (key: string) => {
    dispatch({
      type: 'global/removePageTags',
      payload: key,
    });
  }

  const contentItemRender = (tab : DataSourceItem) => itemRender
      ? itemRender(tab)
      : tab.component

  const handleBatchClose = (e: { key: string }) => {
    dispatch({
      type: 'global/batchRemovePageTags',
      payload: e.key,
    });
  }

  return (
    <Tabs
      activeKey={activeKey}
      onChange={handleChange}
      type="editable-card"
      hideAdd
      onEdit={handleEdit}
      tabBarExtraContent={renderExtraContent(handleBatchClose)}
    >
      {dataSource.map(tab => (
        <TabPane
          tab={
            <span>
              {tab.key === activeKey ? (
                <Icon
                  type="reload"
                  onClick={() => {
                    handleRefresh(tab.key);
                  }}
                  spin={refresh}
                />
              ) : null}
              {tab.title}
            </span>
          }
          key={tab.key}
          closable={tab.closable}
        >
          <Router>{contentItemRender(tab)}</Router>
        </TabPane>
      ))}
    </Tabs>
  );
};

export default withRouter(connect(({global}) => ({dataSource: global.pageTabs, activeKey: global.activePageTabKey}))(PageTabs));
