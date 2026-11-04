import { Component } from '@angular/core';

type ContactKind = 'github' | 'linkedin' | 'whatsapp' | 'email';

interface ContactLink {
  kind: ContactKind;
  label: string;
  url: string;
}

const MAINTAINER = {
  name: 'Natalia Gordon',
  jobTitle: 'Software Engineer',
  email: 'g.nataley@gmail.com',
  emailSubject: 'SHIN website – maintenance inquiry',
  whatsappPhone: '972543255952',
  whatsappMessage: "Hi Natalia, I'm contacting you through the SHIN website about website maintenance.",
  github: 'https://github.com/Natalia-Gordon',
  linkedin: 'https://www.linkedin.com/in/natalia-gordon-7979514/',
};

@Component({
  selector: 'app-footer-credits',
  templateUrl: './footer-credits.html',
  styleUrl: './footer-credits.scss',
})
export class FooterCredits {
  protected readonly maintainer = MAINTAINER;

  protected readonly links: ContactLink[] = [
    { kind: 'github', label: `${MAINTAINER.name} on GitHub`, url: MAINTAINER.github },
    { kind: 'linkedin', label: `${MAINTAINER.name} on LinkedIn`, url: MAINTAINER.linkedin },
    {
      kind: 'whatsapp',
      label: `Send ${MAINTAINER.name} a WhatsApp message`,
      url: `https://wa.me/${MAINTAINER.whatsappPhone}?text=${encodeURIComponent(MAINTAINER.whatsappMessage)}`,
    },
    {
      kind: 'email',
      label: `Email ${MAINTAINER.name} (${MAINTAINER.email})`,
      url: `mailto:${MAINTAINER.email}?subject=${encodeURIComponent(MAINTAINER.emailSubject)}`,
    },
  ];
}
