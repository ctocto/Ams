import {connect} from 'dva';
import md5 from 'md5';

// export type MconnectArgType = Array<T>;
export function generateKey(): string {
  let key = '';
  const { hash, pathname, search } = window.location;
  if (hash) {
    key = generateMD5(hash)
  } else {
    key = generateMD5(`${pathname}${search}`);
  }
  return key;
}

export function generateMD5(str: string): string {
  return md5(str);
}

export function generateNameSpace(name: string): string {
  return `${generateKey()}/${name}`;
}

export const dynamicConnect = (...args) => {
  function mapStateToPropsProxy(state, ownProps) {
    const result = args[0](state, ownProps);

    const other = Object.keys(result).reduce((acc, cur) => {
      if (!result[cur]) {
        const namespace = generateNameSpace(cur);
        const pageModel = state[namespace];
        if (pageModel) {
          acc[cur] = pageModel;
        }
      }
      return acc;
    }, {});

    return {
      ...(result || {}),
      ...other
    }
  }
  return (...args2) => connect.apply(null, args.slice(1).concat(mapStateToPropsProxy)).apply(null, args2);
}

export default function dynamicModal(model) {
  const namespace = generateNameSpace(model.namespace);
  return {
    ...model,
    namespace
  };
}
