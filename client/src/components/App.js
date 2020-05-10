import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'

class App extends Component {

    state = { walletinfo: {} };

    componentDidMount(){
        fetch(`${document.location.origin}/api/wallet-info`)
            .then(response => response.json())
            .then(json => this.setState({walletinfo: json}))
    }

    render(){

        const { address, balance } = this.state.walletinfo;

        return(
            <div className='App'>

                <img className='logo' src={logo}></img>
                <br />

                <div>
                    Welcome to Blockchain
                </div>
                <br />
                <div><Link to='/blocks'>Blocks</Link></div>
                <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
                <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
                <br />
                <div className='WalletInfo'>
                    <div>Address: {address}</div>
                    <div>Balance: {balance}</div>
                </div>
            </div>
        )
    }
}

export default App;