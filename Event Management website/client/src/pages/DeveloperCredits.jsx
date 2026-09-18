import { motion } from 'framer-motion';

const DeveloperCredits = () => {
  const credits = [
    { role: 'Lead Developer', name: 'John Doe' },
    { role: 'UI/UX Designer', name: 'Jane Smith' },
    { role: 'Backend Engineer', name: 'Alex Johnson' },
    { role: 'Frontend Developer', name: 'Sarah Williams' },
    { role: 'Database Admin', name: 'Michael Brown' },
    { role: 'Project Manager', name: 'Emily Davis' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwZiAxNyAyYSI+PC9yZWN0PjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxZSAyOSA0ZiI+PC9yZWN0Pjwvc3ZnPg==')] opacity-50 z-0"></div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="z-10 relative h-screen w-full flex items-center justify-center flex-col"
      >
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-500 mb-12 uppercase tracking-[0.2em]">
          Credits
        </h1>

        <div className="h-[60vh] overflow-hidden w-full max-w-lg relative mask-image-fade">
          <motion.div
            animate={{ y: ['100%', '-100%'] }}
            transition={{
              y: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            className="flex flex-col items-center space-y-16 py-10"
          >
            {credits.map((credit, i) => (
              <div key={i} className="text-center">
                <h3 className="text-primary-400 text-sm font-semibold tracking-widest uppercase mb-2">{credit.role}</h3>
                <p className="text-white text-3xl font-bold">{credit.name}</p>
              </div>
            ))}
            
            <div className="text-center mt-32">
              <h3 className="text-primary-400 text-sm font-semibold tracking-widest uppercase mb-2">Powered by</h3>
              <p className="text-white text-3xl font-bold mb-4">Codesky Team</p>
              <p className="text-slate-400">© 2026 All Rights Reserved</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        .mask-image-fade {
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </div>
  );
};

export default DeveloperCredits;
