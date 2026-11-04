export type EmailEvent =
  | 'STEP_ASSIGNED'
  | 'IDEA_APPROVED'
  | 'IDEA_REJECTED'
  | 'KAIZEN_APPROVED'
  | 'KAIZEN_REJECTED'
  | 'ONE_PAGER_SUBMITTED'
  | 'REWARD_ASSIGNED'
  | 'HIGH_IMPACT_NOMINATED'
  | 'PASSWORD_RESET'

export interface TemplateContext {
  recipientName?: string | undefined
  stageCode?: string | undefined
  entityType?: string | undefined
  entityId?: string | undefined
  comment?: string | undefined
  kaizenRef?: string | undefined
  kaizenTitle?: string | undefined
  rewardAmount?: number | null | undefined
  rewardDetails?: string | null | undefined
}

interface EmailTemplate {
  subject: string
  body: string
}

const APP_NAME = 'KIET Kaizen Platform'

export function renderTemplate(event: EmailEvent, ctx: TemplateContext): EmailTemplate {
  const name = ctx.recipientName ?? 'User'

  switch (event) {
    case 'STEP_ASSIGNED':
      return {
        subject: `Action Required: Workflow Step Assigned — ${ctx.stageCode ?? 'Review'}`,
        body: lines([
          `Dear ${name},`,
          '',
          `A workflow step has been assigned to you and requires your attention.`,
          '',
          `Step: ${ctx.stageCode ?? 'Review'}`,
          ctx.entityType ? `Entity: ${ctx.entityType} ${ctx.entityId ?? ''}` : '',
          '',
          `Please log in to the ${APP_NAME} to review and take action.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'IDEA_APPROVED':
      return {
        subject: `Congratulations! Your Submission Has Been Approved`,
        body: lines([
          `Dear ${name},`,
          '',
          `We are pleased to inform you that your submission has been approved.`,
          '',
          ctx.kaizenTitle ? `Title: ${ctx.kaizenTitle}` : '',
          ctx.kaizenRef ? `Reference: ${ctx.kaizenRef}` : '',
          '',
          `Your submission will now proceed to the next phase.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'IDEA_REJECTED':
      return {
        subject: `Update on Your Submission`,
        body: lines([
          `Dear ${name},`,
          '',
          `After review, your submission has not been approved at this time.`,
          '',
          ctx.comment ? `Reviewer comment: ${ctx.comment}` : '',
          '',
          `You may revise and resubmit after addressing the feedback above.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'KAIZEN_APPROVED':
      return {
        subject: `Congratulations! Your Kaizen Has Been Fully Approved`,
        body: lines([
          `Dear ${name},`,
          '',
          `Your implemented Kaizen has been reviewed and fully approved.`,
          '',
          ctx.kaizenTitle ? `Title: ${ctx.kaizenTitle}` : '',
          ctx.kaizenRef ? `Kaizen Reference: ${ctx.kaizenRef}` : '',
          '',
          `Your Kaizen is now eligible for Rewards & Recognition. The Plant OPEX team will be in touch.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'KAIZEN_REJECTED':
      return {
        subject: `Update on Your Kaizen Implementation`,
        body: lines([
          `Dear ${name},`,
          '',
          `After review, your Kaizen implementation documentation has not been approved at this time.`,
          '',
          ctx.kaizenRef ? `Kaizen Reference: ${ctx.kaizenRef}` : '',
          ctx.comment ? `Reviewer comment: ${ctx.comment}` : '',
          '',
          `Please address the feedback and resubmit your One Pager documentation.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'ONE_PAGER_SUBMITTED':
      return {
        subject: `Action Required: One Pager Submitted for Review`,
        body: lines([
          `Dear ${name},`,
          '',
          `A One Pager has been submitted and requires your review.`,
          '',
          ctx.kaizenRef ? `Kaizen Reference: ${ctx.kaizenRef}` : '',
          ctx.kaizenTitle ? `Title: ${ctx.kaizenTitle}` : '',
          '',
          `Please log in to the ${APP_NAME} to review and approve.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'REWARD_ASSIGNED':
      return {
        subject: `Reward Assigned for Your Kaizen`,
        body: lines([
          `Dear ${name},`,
          '',
          `A reward has been assigned for your implemented kaizen.`,
          '',
          ctx.kaizenRef ? `Kaizen Reference: ${ctx.kaizenRef}` : '',
          ctx.kaizenTitle ? `Title: ${ctx.kaizenTitle}` : '',
          ctx.rewardAmount != null ? `Reward Amount: ${ctx.rewardAmount}` : '',
          ctx.rewardDetails ? `Details: ${ctx.rewardDetails}` : '',
          '',
          `Congratulations on your contribution!`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'HIGH_IMPACT_NOMINATED':
      return {
        subject: `Action Required: High-Impact Kaizen Needs Your Rating`,
        body: lines([
          `Dear ${name},`,
          '',
          `A kaizen has been nominated for High-Impact recognition and requires your rating as an SC member.`,
          '',
          ctx.kaizenRef ? `Kaizen Reference: ${ctx.kaizenRef}` : '',
          ctx.kaizenTitle ? `Title: ${ctx.kaizenTitle}` : '',
          '',
          `Please log in to the ${APP_NAME} to submit your rating.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }

    case 'PASSWORD_RESET':
      return {
        subject: `Reset Your ${APP_NAME} Password`,
        body: lines([
          `Dear ${name},`,
          '',
          `We received a request to reset your password. Click the link below to set a new password.`,
          `This link is valid for 1 hour.`,
          '',
          ctx.entityId ? `Reset link: ${ctx.entityId}` : '',
          '',
          `If you did not request a password reset, please ignore this email — your account remains secure.`,
          '',
          `Regards,`,
          APP_NAME,
        ]),
      }
  }
}

function lines(parts: string[]): string {
  return parts.filter((p) => p !== undefined && p !== null).join('\n')
}
