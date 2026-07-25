import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Database...')

  // 1. Create Skills
  console.log('Seeding skills...')
  const skillsData = [
    { name: 'JavaScript', category: 'Programming Language' },
    { name: 'TypeScript', category: 'Programming Language' },
    { name: 'Python', category: 'Programming Language' },
    { name: 'Java', category: 'Programming Language' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Machine Learning', category: 'Data Science' },
    { name: 'Data Structures', category: 'Computer Science' },
  ]

  const skills = []
  for (const skill of skillsData) {
    skills.push(
      await prisma.skill.upsert({
        where: { name: skill.name },
        update: {},
        create: skill,
      })
    )
  }

  // 2. Create Communities
  console.log('Seeding communities...')
  const communitiesData = [
    { name: 'Web Development', description: 'Everything about frontend and backend' },
    { name: 'Artificial Intelligence', description: 'ML, Deep Learning, and AI discussions' },
    { name: 'Cyber Security', description: 'Ethical hacking and security' },
    { name: 'Cloud Computing', description: 'AWS, GCP, Azure' },
  ]

  const communities = []
  for (const community of communitiesData) {
    communities.push(
      await prisma.community.upsert({
        where: { name: community.name },
        update: {},
        create: community,
      })
    )
  }

  // 3. Create Mock Users with Profiles
  console.log('Seeding mock users & profiles...')
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      clerkId: 'mock_clerk_id_1',
      name: 'Alice Johnson',
      profile: {
        create: {
          college: 'MIT',
          branch: 'Computer Science',
          year: 3,
          bio: 'Aspiring Full Stack Developer',
          careerGoal: 'Software Engineer',
          availability: '10 hrs/week',
          languages: ['English', 'Spanish'],
          interests: ['Web Dev', 'Open Source'],
          completion: 80,
          skills: {
            create: [
              { skillId: skills[0].id, level: 'Expert' },
              { skillId: skills[4].id, level: 'Intermediate' }
            ]
          },
          learningGoals: {
            create: [
              { skillId: skills[1].id }
            ]
          }
        }
      }
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      clerkId: 'mock_clerk_id_2',
      name: 'Bob Smith',
      profile: {
        create: {
          college: 'Stanford',
          branch: 'Software Engineering',
          year: 2,
          bio: 'Data Science enthusiast',
          careerGoal: 'Data Scientist',
          availability: '15 hrs/week',
          languages: ['English'],
          interests: ['AI', 'Machine Learning'],
          completion: 75,
          skills: {
            create: [
              { skillId: skills[2].id, level: 'Intermediate' },
              { skillId: skills[10].id, level: 'Beginner' }
            ]
          },
          learningGoals: {
            create: [
              { skillId: skills[6].id }
            ]
          }
        }
      }
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      clerkId: 'mock_clerk_id_3',
      name: 'Charlie Davis',
      profile: {
        create: {
          college: 'UC Berkeley',
          branch: 'Electrical Engineering',
          year: 4,
          bio: 'Backend specialist learning frontend',
          careerGoal: 'Backend Developer',
          availability: '20 hrs/week',
          languages: ['English'],
          interests: ['System Design', 'Cloud'],
          completion: 90,
          skills: {
            create: [
              { skillId: skills[6].id, level: 'Expert' }, // Node.js
              { skillId: skills[8].id, level: 'Intermediate' } // Postgres
            ]
          },
          learningGoals: {
            create: [
              { skillId: skills[4].id } // React
            ]
          }
        }
      }
    }
  })

  // 4. Create Teams
  console.log('Seeding teams...')
  await prisma.team.create({
    data: {
      name: 'AI Hackers',
      description: 'Building an AI project for the global hackathon.',
      requiredSkills: ['Python', 'Machine Learning', 'React'],
      maxMembers: 4,
      hackathonName: 'Global AI Hack 2026',
      status: 'LOOKING_FOR_MEMBERS',
      members: {
        create: [
          { userId: user2.id, role: 'LEADER' }
        ]
      }
    }
  })

  await prisma.team.create({
    data: {
      name: 'Web3 Builders',
      description: 'Creating the next generation of web applications.',
      requiredSkills: ['React', 'Next.js', 'Node.js'],
      maxMembers: 3,
      hackathonName: 'WebFest 2026',
      status: 'ACTIVE',
      members: {
        create: [
          { userId: user1.id, role: 'LEADER' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  })

  // 5. Create Recommendations
  console.log('Seeding recommendations...')
  await prisma.recommendation.upsert({
    where: {
      sourceUserId_targetUserId_type: {
        sourceUserId: user1.id,
        targetUserId: user3.id,
        type: 'Skill Exchange'
      }
    },
    update: {},
    create: {
      sourceUserId: user1.id,
      targetUserId: user3.id,
      score: 92.5,
      type: 'Skill Exchange'
    }
  })

  await prisma.recommendation.upsert({
    where: {
      sourceUserId_targetUserId_type: {
        sourceUserId: user2.id,
        targetUserId: user1.id,
        type: 'Project Partner'
      }
    },
    update: {},
    create: {
      sourceUserId: user2.id,
      targetUserId: user1.id,
      score: 85.0,
      type: 'Project Partner'
    }
  })

  // Add members to communities
  console.log('Adding members to communities...')
  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: user1.id, communityId: communities[0].id } },
    update: {},
    create: { userId: user1.id, communityId: communities[0].id, role: 'ADMIN' }
  })
  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: user2.id, communityId: communities[1].id } },
    update: {},
    create: { userId: user2.id, communityId: communities[1].id, role: 'MEMBER' }
  })

  // 6. Create Connections
  console.log('Seeding connections...')
  await prisma.connection.upsert({
    where: {
      requesterId_receiverId: {
        requesterId: user1.id,
        receiverId: user2.id,
      }
    },
    update: {},
    create: {
      requesterId: user1.id,
      receiverId: user2.id,
      status: 'ACCEPTED',
    }
  })
  
  await prisma.connection.upsert({
    where: {
      requesterId_receiverId: {
        requesterId: user3.id,
        receiverId: user1.id,
      }
    },
    update: {},
    create: {
      requesterId: user3.id,
      receiverId: user1.id,
      status: 'PENDING',
    }
  })

  // 7. Create Chat Room & Messages
  console.log('Seeding chat rooms and messages...')
  await prisma.chatRoom.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id }
        ]
      },
      messages: {
        create: [
          { senderId: user1.id, content: 'Hey Bob, want to team up for the hackathon?', seenBy: [user1.id, user2.id] },
          { senderId: user2.id, content: 'Hey Alice! Yes, absolutely. Do we have a third member?', seenBy: [user1.id, user2.id] }
        ]
      }
    }
  })

  // 8. Create File Assets
  console.log('Seeding file assets...')
  await prisma.fileAsset.create({
    data: {
      userId: user1.id,
      fileKey: 'mock_resume_key_1',
      url: 'https://example.com/alice_resume.pdf',
      type: 'RESUME'
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
