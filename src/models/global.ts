import { Reducer } from 'redux';
import { Subscription, Effect } from 'dva';
import { routerRedux } from 'dva/router';
import { delay } from 'dva/saga';

import { NoticeIconData } from '@/components/NoticeIcon';
import { queryNotices } from '@/services/user';
import { message } from 'antd';
import { ConnectState } from './connect.d';
import { DataSource, DataSourceItem } from '@/components/GlobalHeader/PageTabs';

export interface NoticeItem extends NoticeIconData {
  id: string;
  type: string;
  status: string;
}

export interface GlobalModelState {
  collapsed: boolean;
  notices: NoticeItem[];
  pageTabs: DataSource;
  activePageTabKey: string,
}

export interface GlobalModelType {
  namespace: 'global';
  state: GlobalModelState;
  effects: {
    fetchNotices: Effect;
    clearNotices: Effect;
    changeNoticeReadState: Effect;
    setPageTags: Effect;
    removePageTags: Effect;
    batchRemovePageTags: Effect;
    setActivePageTabKey: Effect;
    refreshPageTab: Effect;
  };
  reducers: {
    changeLayoutCollapsed: Reducer<GlobalModelState>;
    saveNotices: Reducer<GlobalModelState>;
    saveClearedNotices: Reducer<GlobalModelState>;
    savePageTags: Reducer<GlobalModelState>;
    saveActiveTabKey: Reducer<GlobalModelState>;
  };
  subscriptions: { setup: Subscription };
}

const GlobalModel: GlobalModelType = {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
    pageTabs: [],
    activePageTabKey: '',
  },

  effects: {
    *fetchNotices(_, { call, put, select }) {
      const data = yield call(queryNotices);
      yield put({
        type: 'saveNotices',
        payload: data,
      });
      const unreadCount: number = yield select(
        (state: ConnectState) => state.global.notices.filter(item => !item.read).length,
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: data.length,
          unreadCount,
        },
      });
    },
    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: 'saveClearedNotices',
        payload,
      });
      const count: number = yield select((state: ConnectState) => state.global.notices.length);
      const unreadCount: number = yield select(
        (state: ConnectState) => state.global.notices.filter(item => !item.read).length,
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: count,
          unreadCount,
        },
      });
    },
    *changeNoticeReadState({ payload }, { put, select }) {
      const notices: NoticeItem[] = yield select((state: ConnectState) =>
        state.global.notices.map(item => {
          const notice = { ...item };
          if (notice.id === payload) {
            notice.read = true;
          }
          return notice;
        }),
      );

      yield put({
        type: 'saveNotices',
        payload: notices,
      });

      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: notices.length,
          unreadCount: notices.filter(item => !item.read).length,
        },
      });
    },
    *setPageTags({ payload }, { put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.global.pageTabs);

      const hasTab = pageTabs.some((item: DataSourceItem) => item.key === payload.path);
console.log(hasTab, payload.path, pageTabs)
      const key = payload.path;
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
      const { pageTabs, activePageTabKey } = yield select(
        (state: ConnectState) => state.global,
      );
      const index = pageTabs.findIndex((item: DataSourceItem) => item.key === payload);
      const newPageTabs = pageTabs.filter((item: DataSourceItem) => item.key !== payload);

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
      const { pageTabs, activePageTabKey } = yield select((state: ConnectState) => state.global);
      let newPageTabs = [];

      if (payload === '1') { // 关闭全部
        newPageTabs = pageTabs.filter((item: DataSourceItem) => !item.closable);
        yield put(routerRedux.push(newPageTabs[0].path));
      } else if (payload === '2') { // 关闭其它
        newPageTabs = pageTabs.filter(
          (item: DataSourceItem) => !item.closable || item.key === activePageTabKey,
        );
      }

      yield put({
        type: 'savePageTags',
        payload: newPageTabs,
      });
    },
    *setActivePageTabKey({ payload }, { put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.global.pageTabs);
      const tab = pageTabs.find((item: DataSourceItem) => item.key === payload);
      yield put(routerRedux.push(tab.path));
      yield put({
        type: 'saveActiveTabKey',
        payload,
      });
    },
    *refreshPageTab({ payload }, { call, put, select }) {
      const pageTabs = yield select((state: ConnectState) => state.global.pageTabs);
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
    changeLayoutCollapsed(state, { payload }): GlobalModelState {
      return {
        ...state,
        collapsed: payload,
      };
    },
    saveNotices(state, { payload }): GlobalModelState {
      return {
        collapsed: false,
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state, { payload }): GlobalModelState {
      return {
        collapsed: false,
        ...state,
        notices: state.notices.filter((item): boolean => item.type !== payload),
      };
    },
    savePageTags(state, { payload }): GlobalModelState {
      return {
        ...state,
        pageTabs: payload,
      };
    },
    saveActiveTabKey(state, { payload }): GlobalModelState {
      return {
        ...state,
        activePageTabKey: payload,
      };
    },
  },

  subscriptions: {
    setup({ history }): void {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      history.listen(({ pathname, search }): void => {
        console.log(pathname, search, 1231231231);
      });
    },
  },
};

export default GlobalModel;
