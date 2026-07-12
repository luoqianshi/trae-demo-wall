import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarField from '../components/shared/StarField';

export default function PageHome() {
  const navigate = useNavigate();

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-deep)', cursor: 'default' }}
    >
      {/* Star area - Echo Sky entrance */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative flex-1 flex flex-col items-center justify-center cursor-pointer group"
        style={{ background: 'var(--bg-deep)', transformOrigin: 'top' }}
        onClick={() => navigate('/echo-square')}
      >
        <StarField density={40} />
        {/* Featured anchor star */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, type: 'spring', stiffness: 120, damping: 12 }}
          style={{ position: 'relative', zIndex: 10, marginBottom: 16 }}
        >
          {/* Star glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 64,
              height: 64,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(240,236,224,0.35) 0%, rgba(240,236,224,0.08) 40%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Center bright point */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 6,
              height: 6,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'var(--star-white)',
              boxShadow: '0 0 4px rgba(240,236,224,0.6)',
              pointerEvents: 'none',
            }}
          />
          {/* Horizontal flare */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 52,
              height: 1.5,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(to right, transparent 0%, rgba(240,236,224,0.08) 15%, rgba(240,236,224,0.4) 45%, rgba(240,236,224,0.6) 50%, rgba(240,236,224,0.4) 55%, rgba(240,236,224,0.08) 85%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Vertical flare */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 1.5,
              height: 52,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(240,236,224,0.08) 15%, rgba(240,236,224,0.4) 45%, rgba(240,236,224,0.6) 50%, rgba(240,236,224,0.4) 55%, rgba(240,236,224,0.08) 85%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Diagonal flare 45deg - subtle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 36,
              height: 1,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              background: 'linear-gradient(to right, transparent, rgba(240,236,224,0.15), transparent)',
              pointerEvents: 'none',
            }}
          />
          {/* Diagonal flare -45deg - subtle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 36,
              height: 1,
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              background: 'linear-gradient(to right, transparent, rgba(240,236,224,0.15), transparent)',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative z-10 text-center"
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              color: 'var(--star-white)',
              letterSpacing: '0.06em',
              fontWeight: 400,
              marginBottom: '0.5rem',
            }}
          >
            大家的回声星空
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
              color: 'rgba(200,200,200,0.6)',
              letterSpacing: '0.04em',
            }}
          >
            向上望
          </p>
        </motion.div>
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(240,236,224,0.06), transparent 65%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* Door area - Personal Journal entrance */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative flex-1 flex flex-col items-center justify-center cursor-pointer group"
        style={{ background: 'linear-gradient(to bottom, var(--bg-deep), #080808)', transformOrigin: 'bottom' }}
        onClick={() => navigate('/gallery')}
      >
        {/* Door ambient glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0.25, 0.4] }}
          transition={{ delay: 1.2, duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: '140px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 55%, rgba(245,230,200,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(16px)',
          }}
        />
        {/* Door */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
          className="relative mb-8"
          style={{
            width: '70px',
            height: '110px',
            border: '1.5px solid rgba(200,168,96,0.35)',
            borderRadius: '4px 4px 0 0',
            background: '#080808',
            overflow: 'visible',
          }}
        >
          {/* Warm glow from behind the door */}
          <div
            style={{
              position: 'absolute',
              left: '65%',
              top: '5%',
              width: '30%',
              height: '90%',
              background: 'radial-gradient(ellipse, rgba(245,230,200,0.25), transparent 70%)',
            }}
          />
          {/* Single door panel - hinged left, slightly open outward */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '85%',
              background: 'linear-gradient(135deg, #151515, #0C0C0C)',
              transform: 'perspective(400px) rotateY(-20deg)',
              transformOrigin: 'left center',
              zIndex: 2,
            }}
          />
          {/* Door handle */}
          <div
            style={{
              position: 'absolute',
              left: '65%',
              top: '45%',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--gold)',
              boxShadow: '0 0 6px rgba(200,168,96,0.5)',
              zIndex: 10,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="relative z-10 text-center"
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              color: 'var(--gold)',
              letterSpacing: '0.06em',
              fontWeight: 400,
              marginBottom: '0.5rem',
            }}
          >
            我的<span style={{ fontWeight: 500, letterSpacing: '0.12em', margin: '0 0.05em', fontSize: '0.88em' }}>角色</span>档案馆
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
              color: 'rgba(200,168,96,0.55)',
              letterSpacing: '0.04em',
            }}
          >
            打开门
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
