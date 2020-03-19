import { Reducer } from 'redux';
import { Subscription, Effect } from 'dva';
import { routerRedux } from 'dva/router';
import { delay } from 'dva/saga';

import { message } from 'antd';
import { ConnectState } from './connect';
import { DataSource, DataSourceItem } from '@/components/GlobalHeader/PageTabs';

export interface PageTabsModelState {
  pageTabs?: DataSource;
  activePageTabKey?: string,
}

function unModel(namespace: string[]) {
  namespace.forEach(key => {
    window.g_app.unmodel(key);
  })
}

export interface PageTabsModelType {
  namespace: 'pageTabs';
  state: PageTabsModelState;
  effects: {
    setPageTags: Effect;
    removePageTags: Effect;
    batchRemovePageTags: Effect;
    setActivePageTabKey: Effect;
    refreshPageTab: Effect;
  };
  reducers: {
    savePageTags: Reducer<PageTabsModelState>;
    saveActiveTabKey: Reducer<PageTabsModelState>;
  };
  subscriptions: { setup: Subscription };
}

const PageTabsModel: PageTabsModelType = {
  namespace: 'pageTabs',

  state: {
    pageTabs: [],
    activePageTabKey: '',
  },

  effects: {
    *setPageTags({ payload }, { put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.pageTabs.pageTabs);

      const hasTab = pageTabs.some((item: DataSourceItem) => item.key === payload.key);

      const {key} = payload;
      yield put({
        type: 'saveActiveTabKey',
        payload: key,
      });
      if (!hasTab) {
        if (pageTabs.length >= 20) {
          yield put(routerRedux.goBack());
          message.warning('最多可以打开20个标签页')
        } else {
          yield put({
            type: 'savePageTags',
            payload: [
              ...pageTabs,
              {
                key,
                title: payload.name,
                component: payload.component,
                closable: true,
                path: payload.path,
              },
            ],
          });
        }
      }
    },
    *removePageTags({ payload }, { put, select }) {
      const state = yield select((state: ConnectState) => state);
      const { pageTabs, activePageTabKey } = state.pageTabs;
      const index = pageTabs.findIndex((item: DataSourceItem) => item.key === payload);
      const newPageTabs = pageTabs.filter((item: DataSourceItem) => item.key !== payload);
      const namespaces = Object.keys(state).filter(item => item.includes(`${payload}/`));

      unModel(namespaces);

      const isActive = activePageTabKey === payload;
      if (isActive) {
        const newIndex = newPageTabs[index] ? index : index - 1;
        yield put({
          type: 'setActivePageTabKey',
          payload: newPageTabs[newIndex].key,
        });
      }

      yield put({
        type: 'savePageTags',
        payload: newPageTabs,
      });
    },
    *batchRemovePageTags({ payload }, { put, select }) {
      const state = yield select((state: ConnectState) => state);
      const { pageTabs, activePageTabKey } = state.pageTabs;
      let newPageTabs = [];
      let keys = [];

      if (payload === '1') { // 关闭全部
        newPageTabs = pageTabs.filter((item: DataSourceItem) => !item.closable);
        keys = pageTabs.reduce((acc, cur: DataSourceItem) => {
          if (cur.closable) {
            acc.push(cur.key);
          }
          return acc;
        }, []);
        yield put(routerRedux.push(newPageTabs[0].path));
      } else if (payload === '2') { // 关闭其它
        newPageTabs = pageTabs.filter(
          (item: DataSourceItem) => !item.closable || item.key === activePageTabKey,
        );
        keys = pageTabs.reduce((acc, cur: DataSourceItem) => {
          if (cur.closable && cur.key !== activePageTabKey) {
            acc.push(cur.key);
          }
          return acc;
        }, []);
      }

      const namespaces = Object.keys(state).filter(item => keys.includes(item.split('/')[0]));

      unModel(namespaces);

      yield put({
        type: 'savePageTags',
        payload: newPageTabs,
      });
    },
    *setActivePageTabKey({ payload }, { put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.pageTabs.pageTabs);
      const tab = pageTabs.find((item: DataSourceItem) => item.key === payload);
      yield put({
        type: 'saveActiveTabKey',
        payload,
      });
      yield put(routerRedux.push(tab.path));
    },
    *refreshPageTab({ payload }, { call, put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.pageTabs.pageTabs);
      const index = pageTabs.findIndex((item: DataSourceItem) => item.key === payload);

      const { component } = pageTabs[index];
      pageTabs[index].component = undefined;
      yield put({
        type: 'savePageTags',
        payload: pageTabs,
      });
      yield call(delay, 1000);
      pageTabs[index].component = component;
      yield put({
        type: 'savePageTags',
        payload: pageTabs,
      });
    },
  },

  reducers: {
    savePageTags(state, { payload }) {
      return {
        ...state,
        pageTabs: payload,
      };
    },
    saveActiveTabKey(state, { payload }) {
      return {
        ...state,
        activePageTabKey: payload,
      };
    },
  },

  subscriptions: {
    setup({ dispatch, history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }): void => {
        console.log(pathname, search, 1231231231);
      });
    },
  },
};

export default PageTabsModel;
