// Custom dictionary of technical skills and their regex aliases
interface SkillDictionary {
  [key: string]: RegExp;
}

export const SKILLS_DICTIONARY: SkillDictionary = {
  'React': /\b(react|reactjs|react\.js)\b/i,
  'Node.js': /\b(node|nodejs|node\.js)\b/i,
  'JavaScript': /\b(javascript|js|es6)\b/i,
  'PostgreSQL': /\b(postgres|postgresql)\b/i,
  'TypeScript': /\b(ts|typescript)\b/i,
  'Docker': /\b(docker)\b/i,
  'AWS': /\b(aws|amazon\s+web\s+services|ec2|s3|rds)\b/i,
  'Python': /\b(python|py|django|flask|fastapi)\b/i,
  'Java': /\b(java|spring|springboot)\b/i,
  'C++': /\b(c\+\+)\b/i,
  'HTML/CSS': /\b(html|html5|css|css3|sass|less)\b/i,
  'Git': /\b(git|github|gitlab|bitbucket)\b/i,
  'Kubernetes': /\b(k8s|kubernetes)\b/i,
  'MongoDB': /\b(mongo|mongodb)\b/i,
  'Redis': /\b(redis)\b/i,
  'GraphQL': /\b(graphql|gql)\b/i,
  'Next.js': /\b(next|nextjs|next\.js)\b/i,
  'Vue.js': /\b(vue|vuejs|vue\.js)\b/i,
  'Tailwind CSS': /\b(tailwind|tailwindcss)\b/i,
  'Express': /\b(express|expressjs|express\.js)\b/i,
  'CI/CD': /\b(ci\/cd|jenkins|circleci|github\s+actions)\b/i,
  'Linux': /\b(linux|ubuntu|debian|redhat|centos)\b/i,
};

/**
 * Extracts all matched skills from a given text string
 * @param text Content block to evaluate
 * @returns Array of unique skill names found
 */
export const extractSkills = (text: string): string[] => {
  const matched: string[] = [];
  
  for (const [skillName, regex] of Object.entries(SKILLS_DICTIONARY)) {
    if (regex.test(text)) {
      matched.push(skillName);
    }
  }
  
  return matched;
};

/**
 * Compares resume skills against required JD skills
 * @param resumeText Extracted resume text
 * @param jdText Pasteable Job Description text
 * @returns Object holding lists of matched and missing skills
 */
export const compareSkills = (resumeText: string, jdText: string) => {
  // 1. Identify what skills are required by the Job Description
  const requiredSkills = extractSkills(jdText);
  
  // If no required skills are found in the JD, default to all matching dictionary skills found in the resume
  if (requiredSkills.length === 0) {
    const resumeSkills = extractSkills(resumeText);
    return {
      matchedSkills: resumeSkills,
      missingSkills: [] // No JD skills identified means nothing is marked missing
    };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // 2. Classify each required skill based on presence in the resume
  for (const skill of requiredSkills) {
    const regex = SKILLS_DICTIONARY[skill];
    if (regex && regex.test(resumeText)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  return {
    matchedSkills,
    missingSkills
  };
};
