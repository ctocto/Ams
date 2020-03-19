import React, { useState, useEffect, useCallback } from 'react';
import withRouter from 'umi/withRouter';
import { Tabs, Icon, Dropdown, Menu } from 'antd';
import { TabsProps } from 'antd/es/tabs';
import { getAuthorityFromRouter } from '@/utils/utils';
import { connect } from 'dva';
import { generateMD5 } from '@/utils/dynamicModel';
import { Dispatch } from 'redux';
import { Location } from 'history';
import { ConnectState } from '@/models/connect';
import classNames from 'classnames';
import {
  BasicLayoutProps as ProLayoutProps,
} from '@ant-design/pro-layout';
import { Route } from 'dva/router';
import { RouteProps } from 'react-router';
import styles from './index.less';


const { TabPane } = Tabs;
export interface DataSourceItem {
  title: string;
  key: string;
  path: string;
  component: RouteProps['component'];
  closable: boolean;
};
export type DataSource = Array <DataSourceItem>;
type ActiveKey = TabsProps['activeKey'];

interface PageTabsProps {
  dataSource: DataSource;
  activeKey?: ActiveKey;
  routeData: ProLayoutProps['route'] & {
    authority: string[];
  };
  itemRender?: () => {};
  dispatch: Dispatch;
  location: Location;
}

interface PageTabsBarProps extends PageTabsProps {
  children: React.ReactElement | JSX.Element[];
}

interface PageTabsPaneProps {
  dataSource: DataSource;
  activeKey?: ActiveKey;
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

const RenderContent = ({ key, component }: { key: DataSourceItem['key'], component: DataSourceItem['component'] }) => <Route key={key} component={component} />

const PageTabsBar: React.FC<PageTabsBarProps> = React.memo(props => {
const {
  dataSource = [],
  activeKey,
  location,
  dispatch,
  routeData,
} = props;
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const data = getAuthorityFromRouter(routeData.routes, location.pathname);

    const path = `${location.pathname}${location.search}`;
    dispatch({
      type: 'pageTabs/setPageTags',
      payload: {
        ...data,
        path,
        key: generateMD5(path),
      },
    });
  }, [location.pathname, location.search]);

  const handleChange = (key: string) => {
    dispatch({
      type: 'pageTabs/setActivePageTabKey',
      payload: key,
    });
  };

  const handleRefresh = (key: ActiveKey) => {
    setRefresh(true);
    dispatch({
      type: 'pageTabs/refreshPageTab',
      payload: key,
    });
    setTimeout(() => {
      setRefresh(false);
    }, 1000);
  };

  const handleEdit = (key: string) => {
    dispatch({
      type: 'pageTabs/removePageTags',
      payload: key,
    });
  }

  const renderPane = useCallback(() => dataSource.map(tab => (
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
        <div>
        <RenderContent key={tab.key} component={tab.component} />
        </div>
      </TabPane>
    )), [dataSource]);

  const handleBatchClose = (e: { key: string }) => {
    dispatch({
      type: 'pageTabs/batchRemovePageTags',
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
      {renderPane()}
    </Tabs>
  );
});


const PageTabsPane: React.FC<PageTabsPaneProps> = React.memo(props => {
  const {
    dataSource,
    activeKey,
  } = props;
  return (
    <div className={styles.PageTabsComponent}>
      {
        dataSource.map(tab => (
          <div className={classNames({ [styles.hide]: activeKey !== tab.key })} key={tab.key}>
            <RenderContent key={tab.key} component={tab.component} />
          </div>
        ))
      }
    </div>
  );
});

export default withRouter(
  connect(
    ({ pageTabs }: ConnectState) => ({
      dataSource: pageTabs.pageTabs,
      activeKey: pageTabs.activePageTabKey
    })
  )(PageTabsBar)
);

export const PageTabsConent = connect(
  ({ pageTabs }: ConnectState) => ({
    dataSource: pageTabs.pageTabs,
    activeKey: pageTabs.activePageTabKey
  })
)(PageTabsPane);


