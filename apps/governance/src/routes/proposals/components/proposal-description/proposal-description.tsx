import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoundedWrapper } from '@vegaprotocol/ui-toolkit';
import { SubHeading } from '../../../../components/heading';
import { CollapsibleToggle } from '../../../../components/collapsible-toggle';

export const ProposalDescription = ({
  description,
}: {
  description: string;
}) => {
  const { t } = useTranslation();
  const [showDescription, setShowDescription] = useState(false);

  return (
    <section data-testid="proposal-description">
      <CollapsibleToggle
        toggleState={showDescription}
        setToggleState={setShowDescription}
        dataTestId={'proposal-description-toggle'}
      >
        <SubHeading title={t('proposalDescription')} />
      </CollapsibleToggle>

      {showDescription && (
        <RoundedWrapper paddingBottom={true} marginBottomLarge={true}>
          <div className="p-2">
            <ReactMarkdown
              className="react-markdown-container"
              /* Prevents HTML embedded in the description from rendering */
              skipHtml={true}
              /* Stops users embedding images which could be used for tracking  */
              disallowedElements={['img']}
              linkTarget="_blank"
            >
              {description}
            </ReactMarkdown>
          </div>
        </RoundedWrapper>
      )}
    </section>
  );
};
