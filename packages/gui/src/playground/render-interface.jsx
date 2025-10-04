/*!
 * Copyright (C) 2021 Thomas Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import {
    FormattedMessage,
    defineMessages,
    injectIntl,
    intlShape,
} from "react-intl";
import { getIsLoading } from "../reducers/project-state.js";
import AppStateHOC from "../lib/app-state-hoc.jsx";
import ErrorBoundaryHOC from "../lib/error-boundary-hoc.jsx";
import TWThemeManagerHOC from "../containers/tw-theme-manager-hoc.jsx";
import TWProjectMetaFetcherHOC from "../lib/tw-project-meta-fetcher-hoc.jsx";
import TWStateManagerHOC from "../lib/tw-state-manager-hoc.jsx";
import SBFileUploaderHOC from "../lib/sb-file-uploader-hoc.jsx";
import TWPackagerIntegrationHOC from "../lib/tw-packager-integration-hoc.jsx";
import SettingsStore from "../addons/settings-store-singleton";
import "../lib/tw-fix-history-api";
import GUI from "./render-gui.jsx";
import MenuBar from "../components/menu-bar/menu-bar.jsx";
import ProjectInput from "../components/tw-project-input/project-input.jsx";
import FeaturedProjects from "../components/tw-featured-projects/featured-projects.jsx";
import Description from "../components/tw-description/description.jsx";
import BrowserModal from "../components/browser-modal/browser-modal.jsx";
import CloudVariableBadge from "../containers/tw-cloud-variable-badge.jsx";
import { isBrowserSupported } from "../lib/tw-environment-support-prober";
import AddonChannels from "../addons/channels";
import { loadServiceWorker } from "./load-service-worker";
import runAddons from "../addons/entry";
import InvalidEmbed from "../components/tw-invalid-embed/invalid-embed.jsx";
import Clippy from "../containers/amp-clippy.jsx";
import Footer from "../components/amp-footer/footer.jsx";
import styles from "./interface.css";
import {
    APP_BLOG,
    APP_FORUMS_BUGS,
    APP_NAME,
    APP_SLOGAN,
} from "@ampmod/branding";

const isInvalidEmbed = window.parent !== window;

const handleClickAddonSettings = addonId => {
    // addonId might be a string of the addon to focus on, undefined, or an event (treat like undefined)
    const path =
        process.env.ROUTING_STYLE === "wildcard" ? "addons" : "addons.html";
    const url = `${process.env.ROOT}${path}${typeof addonId === "string" ? `#${addonId}` : ""}`;
    window.open(url);
};

const messages = defineMessages({
    defaultTitle: {
        defaultMessage: "Run Scratch projects faster",
        description: "Title of homepage",
        id: "tw.guiDefaultTitle",
    },
});

const WrappedMenuBar = compose(
    SBFileUploaderHOC,
    TWPackagerIntegrationHOC
)(MenuBar);

if (AddonChannels.reloadChannel) {
    AddonChannels.reloadChannel.addEventListener("message", () => {
        location.reload();
    });
}

if (AddonChannels.changeChannel) {
    AddonChannels.changeChannel.addEventListener("message", e => {
        SettingsStore.setStoreWithVersionCheck(e.data);
    });
}

runAddons();

class Interface extends React.Component {
    constructor(props) {
        super(props);
        this.handleUpdateProjectTitle =
            this.handleUpdateProjectTitle.bind(this);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            loadServiceWorker();
        }
    }
    handleUpdateProjectTitle(title, isDefault) {
        if (isDefault || !title) {
            document.title = `${APP_NAME} - ${APP_SLOGAN}`;
        } else {
            document.title = `${title} - ${APP_NAME}`;
        }
    }
    render() {
        if (
            new URLSearchParams(window.location.search).has("crash-peacefully")
        ) {
            throw new TypeError(
                "Simulated a TypeError to test the error screen. " +
                    `If someone sent you a link to this, just open ${APP_NAME} in ` +
                    "a new tab and carry on with your day. This is not a bug."
            );
        }
        if (isInvalidEmbed) {
            return <InvalidEmbed />;
        }

        const {
            /* eslint-disable no-unused-vars */
            intl,
            hasCloudVariables,
            description,
            isFullScreen,
            isLoading,
            isPlayerOnly,
            isRtl,
            projectId,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const isHomepage = isPlayerOnly && !isFullScreen;
        const isEditor = !isPlayerOnly;
        return (
            <div
                className={classNames(styles.container, {
                    [styles.playerOnly]: isHomepage,
                    [styles.editor]: isEditor,
                })}
                dir={isRtl ? "rtl" : "ltr"}
            >
                {isHomepage ? (
                    <div className={styles.menu}>
                        <WrappedMenuBar
                            canChangeLanguage
                            canManageFiles
                            canChangeTheme
                            enableSeeInside
                        />
                    </div>
                ) : null}
                <div
                    className={styles.center}
                    style={
                        isPlayerOnly
                            ? {
                                  // + 2 accounts for 1px border on each side of the stage
                                  width: `${Math.max(480, props.customStageSize.width) + 2}px`,
                              }
                            : null
                    }
                >
                    <GUI
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        backpackVisible
                        backpackHost="_local_"
                        {...props}
                    />
                </div>
            </div>
        );
    }
}

Interface.propTypes = {
    intl: intlShape,
    hasCloudVariables: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
    }),
    description: PropTypes.shape({
        credits: PropTypes.string,
        instructions: PropTypes.string,
    }),
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    projectId: PropTypes.string,
};

const mapStateToProps = state => ({
    hasCloudVariables: state.scratchGui.tw.hasCloudVariables,
    customStageSize: state.scratchGui.customStageSize,
    description: state.scratchGui.tw.description,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isLoading: getIsLoading(state.scratchGui.projectState.loadingState),
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    projectId: state.scratchGui.projectState.projectId,
});

const mapDispatchToProps = () => ({});

const ConnectedInterface = injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(Interface)
);

const WrappedInterface = compose(
    AppStateHOC,
    ErrorBoundaryHOC("TW Interface"),
    // amp: Trigger TWThemeManagerHOC earlier so early crash message errors are readable
    TWThemeManagerHOC,
    TWProjectMetaFetcherHOC,
    TWStateManagerHOC,
    TWPackagerIntegrationHOC
)(ConnectedInterface);

export default WrappedInterface;
