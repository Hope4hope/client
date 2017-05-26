// @flow
import {List} from 'immutable'
import {SearchError} from '../util/errors'
import {friendlyName as friendlyServiceName} from '../util/platforms'

import type {NoErrorTypedAction} from '../constants/types/flux'
import type {IconType} from '../common-adapters/icon'

const services: {[service: string]: true} = {
  Facebook: true,
  GitHub: true,
  'Hacker News': true,
  Keybase: true,
  Reddit: true,
  Twitter: true,
}

export type Service = $Keys<typeof services>

export type FollowingState = 'Following' | 'NotFollowing' | 'NoState' | 'You'

export type SearchPlatforms = 'Keybase' | 'Twitter' | 'Github' | 'Reddit' | 'Hackernews' | 'Pgp' | 'Facebook'

export type RowProps = {|
  id: string,

  leftFollowingState: FollowingState,
  leftIcon: ?IconType, // If service is keybase this can be null
  leftService: Service,
  leftUsername: string,

  rightFollowingState: FollowingState,
  rightFullname: ?string,
  rightIcon: ?IconType,
  rightService: ?Service,
  rightUsername: ?string,

  showTrackerButton: boolean,

  onShowTracker: () => void,
|}

// Keypaths - maybe these should be somewhere else?
export type KeyPath = ['searchv3Chat'] | ['searchv3Profile']

// Actions

export type Search = NoErrorTypedAction<'searchv3:search', {term: string, service: ?string, keyPath: Keypath}>

export type OnShowTracker = NoErrorTypedAction<
  'searchv3:onShowTracker',
  {term: string, service: ?string, keyPath: Keypath}
>

// Helper
function serviceNameToSearchPlatform(serviceName: string): SearchPlatform {
  return {
    keybase: 'Keybase',
    twitter: 'Twitter',
    github: 'Github',
    reddit: 'Reddit',
    hackernews: 'Hackernews',
    pgp: 'Pgp',
    facebook: 'Facebook',
  }[serviceName]
}

// Platform icons

function platformToIcon(platform: SearchPlatforms): IconType {
  return {
    Keybase: 'iconfont-identity-devices',
    Twitter: 'iconfont-identity-twitter',
    Github: 'iconfont-identity-github',
    Reddit: 'iconfont-identity-reddit',
    Hackernews: 'iconfont-identity-hn',
    Pgp: 'iconfont-identity-pgp',
    Facebook: 'iconfont-identity-facebook',
  }[platform]
}

function platformToLogo24(platform: SearchPlatforms): IconType {
  return {
    Keybase: 'icon-keybase-logo-24',
    Twitter: 'icon-twitter-logo-24',
    Github: 'icon-github-logo-24',
    Reddit: 'icon-reddit-logo-24',
    Hackernews: 'icon-hacker-news-logo-24',
    Pgp: 'icon-pgp-key-24',
    Facebook: 'icon-facebook-logo-24',
  }[platform]
}

// Parse fns

export type RawResult = {
  score: number,
  keybase: ?{
    username: string,
    uid: string,
    picture_url: ?string,
    full_name: ?string,
    is_followee: boolean,
  },
  service: ?{
    service_name: string,
    username: string,
    picture_url: ?string,
    bio: ?string,
    location: ?string,
    full_name: ?string,
  },
}

function externalServiceToId(serviceName: string, serviceUsername: string): string {
  return `${serviceName}-${serviceUsername}`
}

function _parseKeybaseRawResultToRow(
  result: RawResult,
  isFollowingOnKeybase: boolean,
  showTrackerButton: boolean
): RowProps {
  if (result.keybase && result.service) {
    return {
      id: result.keybase.username,
      leftFollowingState: isFollowingOnKeybase,
      leftIcon: null,
      leftUsername: result.keybase.username,
      leftService: 'Keybase',

      rightFollowingState: 'NoState', // We don't currently get this information
      rightFullname: result.keybase.full_name,
      rightIcon: platformToIcon(serviceNameToSearchPlatform(result.service.service_name)),
      rightService: friendlyServiceName(result.service.service_name),
      rightUsername: result.service.username,
      showTrackerButton,
    }
  }

  if (result.keybase) {
    return {
      id: result.keybase.username,
      leftFollowingState: isFollowingOnKeybase,
      leftIcon: null,
      leftUsername: result.keybase.username,
      leftService: 'Keybase',

      rightFollowingState: 'NoState', // We don't currently get this information
      rightFullname: result.keybase.full_name,
      rightIcon: null,
      rightService: null,
      rightUsername: null,
      showTrackerButton,
    }
  }

  throw new SearchError('Invalid raw result for keybase. Missing result.keybase', result)
}

function _parseThirdPartyRawResultToRow(
  result: RawResult,
  isFollowingOnKeybase: boolean,
  showTrackerButton: boolean
): RowProps {
  if (result.service && result.keybase) {
    return {
      id: result.keybase.username,
      leftFollowingState: 'NoState',
      leftIcon: platformToLogo24(serviceNameToSearchPlatform(result.service.service_name)),
      leftUsername: result.service.username,
      leftService: friendlyServiceName(result.service.service_name),

      rightFollowingState: isFollowingOnKeybase,
      rightFullname: result.keybase.full_name,
      rightIcon: null,
      rightService: 'Keybase',
      rightUsername: result.keybase.username,
      showTrackerButton,
    }
  }

  if (result.service) {
    return {
      id: externalServiceToId(result.service.service_name, result.service.username),
      leftFollowingState: 'NoState',
      leftIcon: platformToLogo24(serviceNameToSearchPlatform(result.service.service_name)),
      leftUsername: result.servuce.username,
      leftService: friendlyServiceName(result.service.service_name),

      rightFollowingState: 'NoState',
      rightFullname: result.service.full_name,
      rightIcon: null,
      rightService: null,
      rightUsername: null,
      showTrackerButton,
    }
  }

  throw new SearchError('Invalid raw result for service search. Missing result.service', result)
}

function parseRawResultToRow(
  result: RawResult,
  service: string,
  isFollowingOnKeybase: boolean,
  showTrackerButton: boolean
) {
  if (service === '' || service === 'Keybase') {
    return _parseKeybaseRawResultToRow(result)
  } else {
    return _parseThirdPartyRawResultToRow(result)
  }
}

export type State = {|
  // TODO selected, typing, etc
  rows: List<RowProps>,
|}

export {parseRawResultToRow}
