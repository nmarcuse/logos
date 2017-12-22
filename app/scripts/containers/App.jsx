import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import Loadable from 'react-loadable';
import { Debounce } from 'lodash-decorators';
import history from 'modules/history';
import RedirectProtected from 'modules/RedirectProtected';
import RedirectPublic from 'modules/RedirectPublic';

import { initFirebase, detectMobile, restore } from 'actions';

import Home from 'containers/Home';
import Login from 'containers/Login';
import NotFound from 'containers/NotFound';

import Footer from 'components/Footer';
import Header from 'components/Header';
import Loader from 'components/Loader';
import Splash from 'components/Splash';
import SystemAlerts from 'components/SystemAlerts';
import Toolbar from 'components/Toolbar';
import Transition from 'components/Transition';

const AsyncCMS = Loadable({
  loader: () => import(/* webpackChunkName:"cms" */ './CMS'),
  loading: () => (<Loader grow={true} type="logo" />),
});

export class App extends React.PureComponent {
  static propTypes = {
    app: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    firebase: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(initFirebase());

    if (location.pathname === '/cms') {
      dispatch(restore());
    }

    global.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    global.removeEventListener('resize', this.handleResize);
  }

  @Debounce(300)
  handleResize = () => {
    this.props.dispatch(detectMobile(window.innerWidth <= 700));
  };

  render() {
    const { app, firebase, dispatch, router, user } = this.props;
    const isPublic = router.location ? router.location.pathname === '/' : true;

    const output = {
      html: (<Loader type="logo" grow={true} />),
      splash: [],
    };

    if (!firebase.isReady) {
      output.splash.push(<Splash key="Splash" />);
    }

    if (app.rehydrated) {
      output.html = (
        <ConnectedRouter history={history}>
          <div className="app">
            {isPublic && <Header app={app} dispatch={dispatch} firebase={firebase} />}
            {isPublic && firebase.isReady && (
              <Toolbar app={app} firebase={firebase} dispatch={dispatch} />
            )}
            <main className="app__main">
              <Switch>
                <Route exact path="/" component={Home} />
                <RedirectPublic
                  exact
                  path="/login"
                  component={Login}
                  isAuthenticated={user.isAuthenticated}
                />
                <RedirectProtected
                  path="/cms"
                  component={AsyncCMS}
                  isAuthenticated={user.isAuthenticated}
                />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Transition classNames="splash__animation" timeout={1100}>
              {output.splash}
            </Transition>
            {isPublic && (<Footer dispatch={dispatch} />)}
            <SystemAlerts alerts={app.alerts} dispatch={dispatch} />
          </div>
        </ConnectedRouter>
      );
    }

    return (
      <div key="App">
        {output.html}
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return {
    app: state.app,
    firebase: state.firebase,
    router: state.router,
    user: state.user,
  };
}

export default connect(mapStateToProps)(App);
