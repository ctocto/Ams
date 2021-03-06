import React, { useEffect } from 'react';
import { Card, Typography, Alert, Icon } from 'antd';

export default (): React.ReactNode => {
  console.log('component update')
  useEffect(() => {
    console.log('component did mount')
    return () => console.log('component will unmount');
  }, [])
  return (
    <div>
      <Card>
        <p>admin</p>
        <Alert
          message="umi ui 现已发布，欢迎使用 npm run ui 启动体验。"
          type="success"
          showIcon
          banner
          style={{
            margin: -12,
            marginBottom: 48,
          }}
        />
        <Typography.Title level={2} style={{ textAlign: 'center' }}>
          <Icon type="smile" theme="twoTone" /> Ant Design Pro{' '}
          <Icon type="heart" theme="twoTone" twoToneColor="#eb2f96" /> You
        </Typography.Title>
      </Card>
      <p style={{ textAlign: 'center', marginTop: 24 }}>
        Want to add more pages? Please refer to{' '}
        <a href="https://pro.ant.design/docs/block-cn" target="_blank" rel="noopener noreferrer">
          use block
        </a>
        。
      </p>
    </div>
  )
};
