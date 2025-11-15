配置 IAP
本部分介绍运行 1.24 或更高版本的 GKE 集群提供的功能。

Identity-Aware Proxy (IAP) 会对与 HTTPRoute 关联的后端服务强制执行访问权限控制政策。借助此强制执行措施，只有分配了正确 Identity and Access Management (IAM) 角色且经过身份验证的用户或应用才能访问这些后端服务。

默认情况下，后端服务未应用 IAP，您需要在 GCPBackendPolicy 中明确配置 IAP。

如需通过 Gateway 配置 IAP，请执行以下操作：

为 GKE 启用 IAP 请勿配置后端（配置 BackendConfig），因为 BackendConfig 仅在 Ingress 部署中有效。

为 IAP 创建 Secret：

在 Google Cloud 控制台中，前往凭证页面：

进入“凭据”页面

点击相应客户端的名称，然后下载 OAuth 客户端文件。

从 OAuth 客户端文件中，将 OAuth secret 复制到剪贴板。

创建名为 iap-secret.txt 的文件。

使用以下命令将 OAuth Secret 粘贴到 iap-secret.txt 文件中：



echo -n CLIENT_SECRET > iap-secret.txt
kubectl create secret generic SECRET_NAME --from-file=key=iap-secret.txt
如需指定引用 Secret 的 IAP 政策，请执行以下操作：

创建以下 GCPBackendPolicy 清单，并分别替换 SECRET_NAME 和 CLIENT_ID。将清单保存为 backend-policy.yaml：

服务
多集群服务

```yaml
apiVersion: networking.gke.io/v1
kind: GCPBackendPolicy
metadata:
  name: backend-policy
spec:
  default:
    # IAP OAuth2 settings. For more information about these fields,
    # see https://cloud.google.com/iap/docs/reference/rest/v1/IapSettings#oauth2.
    iap:
      enabled: true
      oauth2ClientSecret:
        name: SECRET_NAME
      clientID: CLIENT_ID
  # Attach to a Service in the cluster.
  targetRef:
    group: ""
    kind: Service
    name: lb-service
```
应用 backend-policy.yaml 清单：



kubectl apply -f backend-policy.yaml
验证配置：

确认在创建具有 IAP 的 GCPBackendPolicy 后，政策已应用：



kubectl get gcpbackendpolicy
输出类似于以下内容：


NAME             AGE
backend-policy   45m
如需了解更多详情，请使用 describe 命令：



kubectl describe gcpbackendpolicy
输出类似于以下内容：

```bash
Name:         backend-policy
Namespace:    default
Labels:       <none>
Annotations:  <none>
API Version:  networking.gke.io/v1
Kind:         GCPBackendPolicy
Metadata:
  Creation Timestamp:  2023-05-27T06:45:32Z
  Generation:          2
  Resource Version:    19780077
  UID:                 f4f60a3b-4bb2-4e12-8748-d3b310d9c8e5
Spec:
  Default:
    Iap:
      Client ID:  441323991697-luotsrnpboij65ebfr13hlcpm5a4heke.apps.googleusercontent.com
      Enabled:    true
      oauth2ClientSecret:
        Name:  my-iap-secret
  Target Ref:
    Group:
    Kind:   Service
    Name:   lb-service
Status:
  Conditions:
    Last Transition Time:  2023-05-27T06:48:25Z
    Message:
    Reason:                Attached
    Status:                True
    Type:                  Attached
Events:
  Type     Reason  Age                 From                   Message
  ----     ------  ----                ----                   -------
  Normal   ADD     46m                 sc-gateway-controller  default/backend-policy
  Normal   SYNC    44s (x15 over 43m)  sc-gateway-controller  Application of GCPBackendPolicy "default/backend-policy" was a success
  ```