// To see this in action, run this in a terminal:
//      gp preview $(gp url 8000)

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Api, JsonRpc, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Tabs } from "antd";

const { TabPane } = Tabs;

const rpc = new JsonRpc(''); // nodeos and web server are on same port

interface CreateData {
    issuer?: string;
    maximum_supply?: string;
};

interface CreateFormState {
    privateKey: string;
    data: CreateData;
    error: string;
};

class CreateForm extends React.Component<{}, CreateFormState> {
    api: Api;

    constructor(props: {}) {
        super(props);
        this.api = new Api({ rpc, signatureProvider: new JsSignatureProvider([]) });
        this.state = {
            privateKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
            data: {
                issuer: 'integral',
                maximum_supply: "1000000.0000 INT"
            },
            error: '',
        };
    }

    setData(data: CreateData) {
        this.setState({ data: { ...this.state.data, ...data } });
    }

    async post() {
        try {
            this.api.signatureProvider = new JsSignatureProvider([this.state.privateKey]);
            const result = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'create',
                        authorization: [{
                            actor: 'integral',
                            permission: 'active',
                        }],
                        data: this.state.data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            console.log(result);
            this.setState({ error: '' });
        } catch (e) {
            if (e.json)
                this.setState({ error: JSON.stringify(e.json, null, 4) });
            else
                this.setState({ error: '' + e });
        }
    }

    render() {
        return <div>
            <table className='table'>
                <tbody>
                    <tr className='tr'>
                        <td className='td'>Private Key</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.privateKey}
                            onChange={e => this.setState({ privateKey: e.target.value })}
                        /></td>
                        <td className='td'>商户账号对应的私钥</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>Issuer</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.issuer}
                            onChange={e => this.setData({ issuer: e.target.value })}
                        /></td>
                        <td className='td'>创建积分的商户账号名</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>Maximum_supply</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.maximum_supply}
                            onChange={e => this.setData({ maximum_supply: e.target.value })}
                        /></td>
                        <td className='td'>创建积分数量 积分名称</td>
                    </tr>
                </tbody>
            </table>
            <br />
            <button className='button' onClick={e => this.post()}>Create</button>
            {this.state.error && <div>
                <br />
                Error:
                <code><pre>{this.state.error}</pre></code>
            </div>}
        </div>;
    }
}

interface IssueData {
    from?: string;
    to?: string;
    quantity?: string;
    memo?: string;
};

interface IssueFormState {
    privateKey: string;
    data: IssueData;
    error: string;
};

class IssueForm extends React.Component<{}, IssueFormState> {
    api: Api;

    constructor(props: {}) {
        super(props);
        this.api = new Api({ rpc, signatureProvider: new JsSignatureProvider([]) });
        this.state = {
            privateKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
            data: {
                from: 'integral',
                to: 'alice',
                quantity: "100.0000 INT",
                memo: "m",
            },
            error: '',
        };
    }

    setData(data: IssueData) {
        this.setState({ data: { ...this.state.data, ...data } });
    }

    async post() {
        try {
            const issue_data = {
                to: this.state.data.from,
                quantity: this.state.data.quantity,
                memo: this.state.data.memo,
            };
            this.api.signatureProvider = new JsSignatureProvider([this.state.privateKey]);
            const issue_result = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'issue',
                        authorization: [{
                            actor: this.state.data.from,
                            permission: 'active',
                        }],
                        data: issue_data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            const issue_transfer = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'transfer',
                        authorization: [{
                            actor: this.state.data.from,
                            permission: 'active',
                        }],
                        data: this.state.data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            console.log(issue_result);
            console.log(issue_transfer);
            this.setState({ error: '' });
        } catch (e) {
            if (e.json)
                this.setState({ error: JSON.stringify(e.json, null, 4) });
            else
                this.setState({ error: '' + e });
        }
    }

    render() {
        return <div>
            <table className='table'>
                <tbody>
                    <tr className='tr'>
                        <td className='td'>Private Key</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.privateKey}
                            onChange={e => this.setState({ privateKey: e.target.value })}
                        /></td>
                        <td className='td'>商户账户对应的私钥</td>
                    </tr>
                     <tr className='tr'>
                        <td className='td'>From</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.from}
                            onChange={e => this.setData({ to: e.target.value })}
                        /></td>
                        <td className='td'>商户账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>To</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.to}
                            onChange={e => this.setData({ to: e.target.value })}
                        /></td>
                        <td className='td'>消费者账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>quantity</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.quantity}
                            onChange={e => this.setData({ quantity: e.target.value })}
                        /></td>
                        <td className='td'>转账金额 积分种类</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>Content</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.memo}
                            onChange={e => this.setData({ memo: e.target.value })}
                        /></td>
                        <td className='td'>备注</td>
                    </tr>
                </tbody>
            </table>
            <br />
            <button className='button' onClick={e => this.post()}>Issue</button>
            {this.state.error && <div>
                <br />
                Error:
                <code><pre>{this.state.error}</pre></code>
            </div>}
        </div>;
    }
}

interface ConsumeData {
    from?: string;
    to?: string;
    quantity?: string;
    memo?: string;
};

interface ConsumeFormState {
    privateKey: string;
    data: ConsumeData;
    error: string;
};

class ConsumeForm extends React.Component<{}, ConsumeFormState>{
    api: Api;

    constructor(props: {}) {
        super(props);
        this.api = new Api({ rpc, signatureProvider: new JsSignatureProvider([]) });
        this.state = {
            privateKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
            data: {
                from: 'integral',
                to: 'alice',
                quantity: "50.0000 INT",
                memo: 'm',
            },
            error: '',
        };
    }

    setData(data: ConsumeData) {
        this.setState({ data: { ...this.state.data, ...data } });
    }

    async post() {
        try {
            this.api.signatureProvider = new JsSignatureProvider([this.state.privateKey]);
            const result = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'transfer',
                        authorization: [{
                            actor: this.state.data.from,
                            permission: 'active',
                        }],
                        data: this.state.data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            console.log(result);
            this.setState({ error: '' });
        } catch (e) {
            if (e.json)
                this.setState({ error: JSON.stringify(e.json, null, 4) });
            else
                this.setState({ error: '' + e });
        }
    }

    render() {
        return <div>
            <table className='table'>
                <tbody>
                    <tr className='tr'>
                        <td className='td'>Private Key</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.privateKey}
                            onChange={e => this.setState({ privateKey: e.target.value })}
                        /></td>
                        <td className='td'>消费者账户对应的私钥</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>From</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.from}
                            onChange={e => this.setData({ from: e.target.value })}
                        /></td>
                        <td className='td'>消费者账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>to</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.to}
                            onChange={e => this.setData({ to: e.target.value })}
                        /></td>
                        <td className='td'>商户账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>quantity</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.quantity}
                            onChange={e => this.setData({ quantity: e.target.value })}
                        /></td>
                        <td className='td'>消费金额 积分种类</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>Content</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.memo}
                            onChange={e => this.setData({ memo: e.target.value })}
                        /></td>
                        <td className='td'>备注</td>
                    </tr>
                </tbody>
            </table>
            <br />
            <button className='button' onClick={e => this.post()}>Consume</button>
            {this.state.error && <div>
                <br />
                Error:
                <code><pre>{this.state.error}</pre></code>
            </div>}
        </div>;
    }
}

interface ExchangeData {
    from?: string;
    to?: string;
    quantity?: string;
    exchanged?: string;
    exchange?: string;
    memo?: string;
};

interface ExchangeFormState {
    privateKey: string;
    data: ExchangeData;
    error: string;
};

class ExchangeForm extends React.Component<{}, ExchangeFormState>{
    api: Api;

    constructor(props: {}) {
        super(props);
        this.api = new Api({ rpc, signatureProvider: new JsSignatureProvider([]) });
        this.state = {
            privateKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
            data: {
                from: 'alice',
                to: 'integral',
                quantity: "25.0000",
                exchange: "INTA",
                exchanged: "INTB",
                memo: 'm',
            },
            error: '',
        };
    }

    setData(data: ExchangeData) {
        this.setState({ data: { ...this.state.data, ...data } });
    }

    async post() {
        try {
            const back_data = {
                from: this.state.data.from,
                to: this.state.data.to,
                quantity: this.state.data.quantity + this.state.data.exchange,
                memo: this.state.data.memo,
            };
            const get_data = {
                from: this.state.data.to,
                to: this.state.data.from,
                quantity: this.state.data.quantity + this.state.data.exchanged,
                memo: this.state.data.memo,
            };
            this.api.signatureProvider = new JsSignatureProvider([this.state.privateKey]);
            const back_result = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'transfer',
                        authorization: [{
                            actor: this.state.data.from,
                            permission: 'active',
                        }],
                        data: back_data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            const get_result = await this.api.transact(
                {
                    actions: [{
                        account: 'integral',
                        name: 'transfer',
                        authorization: [{
                            actor: this.state.data.to,
                            permission: 'active',
                        }],
                        data: get_data,
                    }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                });
            console.log(back_result);
            console.log(get_data);
            this.setState({ error: '' });
        } catch (e) {
            if (e.json)
                this.setState({ error: JSON.stringify(e.json, null, 4) });
            else
                this.setState({ error: '' + e });
        }
    }

    render() {
        return <div>
            <table className='table'>
                <tbody>
                    <tr className='tr'>
                        <td className='td'>Private Key</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.privateKey}
                            onChange={e => this.setState({ privateKey: e.target.value })}
                        /></td>
                        <td className='td'>消费者账户对应的私钥</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>From</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.from}
                            onChange={e => this.setData({ from: e.target.value })}
                        /></td>
                        <td className='td'>消费者账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>to</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.to}
                            onChange={e => this.setData({ to: e.target.value })}
                        /></td>
                        <td className='td'>商家账户名称</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>quantity</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.quantity}
                            onChange={e => this.setData({ quantity: e.target.value })}
                        /></td>
                        <td className='td'>消费金额</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>exchange</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.exchange}
                            onChange={e => this.setData({ exchange: e.target.value })}
                        /></td>
                        <td className='td'>消费者交换积分种类</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>exchanged</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.exchanged}
                            onChange={e => this.setData({ exchanged: e.target.value })}
                        /></td>
                        <td className='td'>消费者被交换积分种类</td>
                    </tr>
                    <tr className='tr'>
                        <td className='td'>Content</td>
                        <td className='td'><input
                            style={{ width: 500 }}
                            value={this.state.data.memo}
                            onChange={e => this.setData({ memo: e.target.value })}
                        /></td>
                        <td className='td'>备注</td>
                    </tr>
                </tbody>
            </table>
            <br />
            <button className='button' onClick={e => this.post()}>Exchange</button>
            {this.state.error && <div>
                <br />
                Error:
                <code><pre>{this.state.error}</pre></code>
            </div>}
        </div>;
    }
}

class Messages extends React.Component<{}, { content: string }> {
    interval: number;

    constructor(props: {}) {
        super(props);
        this.state = { content: '///' };
    }

    componentDidMount() {
        this.interval = window.setInterval(async () => {
            try {
                const rows = await rpc.get_currency_stats("integral","INT");
                let content ='INT\n';
                let row = rows["INT"];
                content +=
                        (row.supply + '').padEnd(12) +
                        (row.max_supply + '').padEnd(12) + '  ' +
                        row.issuer;
                this.setState({ content });
            } catch (e) {
                if (e.json)
                    this.setState({ content: JSON.stringify(e.json, null, 4) });
                else
                    this.setState({ content: '' + e });
            }

        }, 200);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return <code><pre>{this.state.content}</pre></code>;
    }
}

ReactDOM.render(
    <Tabs>
          <TabPane tab="Home" key="1">
            <h2>项目说明</h2>
            <h3>项目背景</h3>
            <div>积分体系存在于生活的各个角落，超市积分，城市居住积分等等。为了降低赚取用户的成本，提升用户活跃度，越来越多的企业也开始选用积分商城来提升用户活跃度。</div>
            <div>EOS是一个免费的开源区块链软件协议，通过创建一个对开发者友好的底层区块链平台，支持多个应用同时运行，为DApp提供底层区块链支持。</div>
            <div>而通用积分是指众多合作商家使用同一种积分对会员进行奖励。会员在积分合作商家消费时能够将获得的积分奖励进行合并累计，积分积累起来，到一定额度时可以兑换礼品、抵扣消费金额，也可以选择转为货币现金形式。</div>
            <h3>目的及意义</h3>
            <div>传统积分系统，因积分交易的限制多、额度小、使用频度低，成为了商家及客户的“鸡肋产品”。区块链的分布式、不可篡改地、可追溯的特性使得积分的跨平台交易得以实现，同时丰富的智能合约系统，使消费者行为数据可以更有效、明确地被发现、分析及使用，从而促使消费力进一步被释放，通过不断优化积分系统的构架和流程达成与商家诉求一致的动态匹配。因此，建立在全网身份认证服务、公共监管征信系统下的区块链积分系统，可以释放出积分交易的优势。</div>
            <div>本项目旨在通过实现一个通用积分系统，学习如何对区块链数据处理、环境部署和应用开发，熟练掌握如何编写EOS智能合约，如何设计一个区块链应用，并使用EOS进行DApp开发。</div>
            <h3>使用说明</h3>
            <div>本网页为通用积分流转平台的各个接口提供使用说明</div>
          </TabPane>
          <TabPane tab="Create" key="2">
            <h2>积分创建接口</h2>
            <div>积分创建接口由商户调用，用于创建积分。</div>
            <p></p>
            <div>商户创建积分，需要三个参数，商户名称、商户私钥和创建的积分数量及积分名称，均为必填。</div>
            <p></p>
            <div>该函数执行后，后台将在区块链上创建对应数量、对应类型的积分，等待商户将其分发给消费者。</div>
            <p></p>
            <div>各个参数的示例及说明如下表，可以通过点机“Create”按钮测试其功能。</div>
            <p></p>
            <CreateForm />
          </TabPane>
          <TabPane tab="Issue" key="3">
            <h2>积分分发接口</h2>
            <div>积分分发接口由商户调用，用于分发积分。</div>
            <p></p>
            <div>商户创建积分，需要五个参数，商户名称、商户私钥、消费者名称、分发的积分数量及积分名称和备注，前四个参数为必填，备注为可选参数。</div>
            <p></p>
            <div>该函数执行后，后台将在区块链上将商户的对应数量、对应类型的积分分发给消费者。</div>
            <p></p>
            <div>各个参数的示例及说明如下表，可以通过点机“Issue”按钮测试其功能。</div>
            <p></p>
            <IssueForm />
          </TabPane>
          <TabPane tab="Consume" key="4">
            <h2>积分消费接口</h2>
            <div>积分创建接口由商户或消费者调用，用于消费积分。</div>
            <p></p>
            <div>商户创建积分，需要五个参数，商户名称、消费者名称、消费者私钥、消费的积分数量及积分名称和备注，前四个参数为必填，最后的参数为可选参数。</div>
            <p></p>
            <div>该函数执行后，后台将在区块链上将对应数量、对应类型的积分发回商户。</div>
            <p></p>
            <div>各个参数的示例及说明如下表，可以通过点机“Consume”按钮测试其功能。</div>
            <p></p>
            <ConsumeForm />
          </TabPane>
          <TabPane tab="Exchange" key="5">
            <h2>积分兑换接口</h2>
            <div>积分兑换接口由消费者调用，用于积分之间的兑换。</div>
            <p></p>
            <div>商户创建积分，需要七个参数，商户名称、消费者名称、消费者私钥、消费的积分数量、兑换积分名称、被兑换积分名称和备注，前六个参数为必填，最后的参数为可选参数。</div>
            <p></p>
            <div>该函数执行后，后台将在区块链上将对应数量的积分兑换。</div>
            <p></p>
            <div>各个参数的示例及说明如下表，可以通过点机“Exchange”按钮测试其功能。</div>
            <p></p>
            <ExchangeForm />
          </TabPane>
          <TabPane tab="Message" key="6">
              <Messages />
          </TabPane>
        </Tabs>,
    document.getElementById("example")
);
