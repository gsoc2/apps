import React, { ReactElement, useEffect, useState } from 'react';
import {
  Button,
  ButtonSize,
} from '@dailydotdev/shared/src/components/buttons/Button';
import { ProfileImageLink } from '@dailydotdev/shared/src/components/profile/ProfileImageLink';
import { useAuthContext } from '@dailydotdev/shared/src/contexts/AuthContext';
import { AuthTriggers } from '@dailydotdev/shared/src/lib/auth';
import { useMutation } from 'react-query';
import { acceptFeatureInvitation } from '@dailydotdev/shared/src/graphql/features';
import { useRouter } from 'next/router';
import Logo, { LogoPosition } from '@dailydotdev/shared/src/components/Logo';
import { useFeature } from '@dailydotdev/shared/src/components/GrowthBookProvider';
import { feature } from '@dailydotdev/shared/src/lib/featureManagement';
import { GenericReferral } from '@dailydotdev/shared/src/lib/featureValues';
import { ActionType } from '@dailydotdev/shared/src/graphql/actions';
import { cloudinary } from '@dailydotdev/shared/src/lib/image';
import {
  ApiErrorResult,
  DEFAULT_ERROR,
} from '@dailydotdev/shared/src/graphql/common';
import { useAnalyticsContext } from '@dailydotdev/shared/src/contexts/AnalyticsContext';
import { AnalyticsEvent } from '@dailydotdev/shared/src/lib/analytics';
import {
  ReferralCampaignKey,
  useMedia,
  useActions,
  useToastNotification,
} from '@dailydotdev/shared/src/hooks';
import { downloadBrowserExtension } from '@dailydotdev/shared/src/lib/constants';
import { FlexCentered } from '@dailydotdev/shared/src/components/utilities';
import BrowsersIcon from '@dailydotdev/shared/icons/browsers.svg';
import { mobileL, laptopL } from '@dailydotdev/shared/src/styles/media';
import { Modal } from '@dailydotdev/shared/src/components/modals/common/Modal';
import {
  ModalKind,
  ModalSize,
} from '@dailydotdev/shared/src/components/modals/common/types';
import CloseButton from '@dailydotdev/shared/src/components/CloseButton';
import { anchorDefaultRel } from '@dailydotdev/shared/src/lib/strings';
import { JoinPageProps } from './common';

export function Referral({
  referringUser,
  redirectTo,
  token,
}: JoinPageProps): ReactElement {
  const router = useRouter();
  const genericReferral = useFeature(feature.genericReferral);
  const { completeAction } = useActions();
  const { trackEvent } = useAnalyticsContext();
  const { displayToast } = useToastNotification();
  const { user, refetchBoot, showLogin } = useAuthContext();
  const isMobile = !useMedia([mobileL.replace('@media ', '')], [true], false);
  const isLaptopL = useMedia([laptopL.replace('@media ', '')], [true], false);
  const {
    mutateAsync: onAcceptMutation,
    isLoading,
    isSuccess,
  } = useMutation(acceptFeatureInvitation, {
    onSuccess: async () => {
      await Promise.all([
        completeAction(ActionType.AcceptedGenericReferral),
        refetchBoot(),
      ]);
      router.push(redirectTo);
    },
    onError: (err: ApiErrorResult) => {
      const message = err?.response?.errors?.[0]?.message;
      displayToast(message ?? DEFAULT_ERROR);
    },
  });
  const [isVideoOpen, setVideoOpen] = useState(false);

  const onVideoModalClose = () => {
    setVideoOpen(false);
  };

  const handleAcceptClick = () => {
    const handleAccept = () =>
      onAcceptMutation({
        token,
        referrerId: referringUser.id,
        feature: ReferralCampaignKey.Generic,
      });

    if (!user) {
      return showLogin({
        trigger: AuthTriggers.GenericReferral,
        options: {
          onLoginSuccess: handleAccept,
          onRegistrationSuccess: handleAccept,
        },
      });
    }

    // since in the page view, query params are tracked automatically,
    // we don't need to send the params here explicitly
    trackEvent({ event_name: AnalyticsEvent.AcceptInvitation });

    return handleAccept();
  };

  useEffect(() => {
    if (genericReferral === GenericReferral.Control) {
      return;
    }

    router.push(redirectTo);
    // router is an unstable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTo, genericReferral]);

  return (
    <div
      style={{
        background: `url(${cloudinary.referralCampaign.genericReferral.backgroundDark})`,
        backgroundSize: 'cover',
      }}
      className="flex overflow-hidden relative flex-col laptop:flex-row flex-auto items-center p-2 laptop:p-6 h-[100vh]"
    >
      <span className="absolute top-8 left-1/2 laptop:left-12 -translate-x-1/2 laptop:translate-x-0">
        <Logo showGreeting={false} position={LogoPosition.Relative} />
      </span>
      <div className="flex z-1 flex-col p-4 laptop:p-0 laptop:mt-0 laptop:ml-3 w-full laptopL:ml-[9.315rem] laptopL:max-w-[37.2rem] mt-[5rem]">
        <span className="flex flex-col laptop:flex-row gap-3 laptopL:gap-6 items-center laptop:items-start mb-6 tablet:mb-8">
          <ProfileImageLink
            user={referringUser}
            picture={{ size: isLaptopL ? 'xxxlarge' : 'xlarge' }}
          />
          <p className="my-auto text-center laptop:text-left typo-headline laptop:typo-title3 laptopL:typo-title2">
            <span className="block laptop:inline">{referringUser.name}</span>
            <span className="font-normal"> invited you to daily.dev</span>
          </p>
        </span>
        <h1 className="w-full text-center laptop:text-left break-words-overflow typo-large-title tablet:typo-mega2 laptopL:typo-giga2">
          The homepage
          <span className="block font-bold text-theme-color-cabbage">
            {' '}
            developers deserve
          </span>
        </h1>
        <p className="mx-auto laptop:mx-0 mt-7 tablet:mt-8 max-w-sm laptopL:max-w-xl text-center laptop:text-left typo-title3 text-theme-label-tertiary">
          Get a feed of the best developer news out there! Read more quality
          articles.
          <span className="tablet:block laptopL:inline">Stay up to date.</span>
        </p>
        <Button
          buttonSize={ButtonSize.Large}
          // important has been used is some classnames to override the default styles as agreed on [thread](https://dailydotdev.slack.com/archives/C05P9ET7S9K/p1699023366663489?thread_ts=1699011522.350609&cid=C05P9ET7S9K)
          className="p-4 mx-auto laptop:mx-0 mt-6 tablet:mt-12 max-w-[17.5rem] mobileL:max-w-[fit-content] btn-primary mobileL:!h-[4rem] mobileL:!p-[0] mobileL:!px-[1.5rem]"
          tag="a"
          href={downloadBrowserExtension}
          onClick={() => {
            handleAcceptClick();
          }}
          target="_blank"
          rel={anchorDefaultRel}
          loading={isLoading}
          disabled={isLoading || isSuccess}
        >
          <FlexCentered className="gap-2 mobileL:typo-title3">
            <BrowsersIcon
              width={isMobile ? '58px' : '80px'}
              height={isMobile ? '30px' : '40px'}
              className="text-theme-label-primary"
            />
            Try it now - It&apos;s free
          </FlexCentered>
        </Button>
      </div>
      <div className="flex fixed flex-auto w-full h-full laptop:initial laptop:bottom-[unset] bottom-[-49%]">
        <div className="flex relative laptop:absolute justify-center self-center m-auto mx-2 z-10 laptopL:right-[-6rem] laptop:right-[-7.5rem] w-[fit-content] laptop:w-[initial]">
          <img
            src={
              cloudinary.referralCampaign.genericReferral.purpleEdgeGlowTablet
            }
            alt="Purple glow right edge"
            className="fixed laptop:top-0 w-full laptop:w-auto laptop:h-full bottom-[-1rem] laptop:bottom-[unset] laptop:rotate-[270deg] z-20"
          />
          <img
            src={cloudinary.referralCampaign.genericReferral.appScreenshot}
            alt="Daily.dev app screenshot of my feed page"
            className="object-contain w-full laptop:w-auto h-auto laptop:h-full z-10 laptopXL:max-h-[39.5rem] laptop:max-h-[25.35rem]"
          />
          <img
            src={cloudinary.referralCampaign.genericReferral.playButton}
            alt="Play daily.dev introduction video"
            className="absolute laptop:self-center laptopL:m-auto laptopXL:h-auto laptop:mr-[8.5rem] laptop:mt-[0.5rem] z-20 laptop:h-[8rem] tablet:h-[14.5rem] h-[7.8rem] tablet:mt-[-1.5rem]"
          />
          <button
            className="absolute z-1 w-full h-full"
            type="button"
            aria-label="Play daily.dev introduction video"
            onClick={() => {
              setVideoOpen(true);
            }}
          />
        </div>
      </div>
      {isVideoOpen && (
        <Modal
          // eslint-disable-next-line @dailydotdev/daily-dev-eslint-rules/no-custom-color
          className="px-8 bg-black"
          kind={ModalKind.FlexibleCenter}
          size={ModalSize.XLarge}
          isOpen={isVideoOpen}
          onRequestClose={onVideoModalClose}
        >
          <CloseButton
            buttonSize={ButtonSize.Small}
            className="top-3 right-3 border-white"
            onClick={onVideoModalClose}
            position={LogoPosition.Absolute}
          />
          <iframe
            className="w-full border-none aspect-video"
            src="https://www.youtube.com/embed/igZCEr3HwCg"
            title="YouTube video player"
            allow="encrypted-media;web-share"
            allowFullScreen
          />
        </Modal>
      )}
    </div>
  );
}
